'use server';
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ID, Query } from "node-appwrite";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { createAdminClient, createSessionClient } from "../appwrite";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { plaidClient } from "@/lib/plaid";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID
} = process.env


export const getUserInfo = async ({ userId }: getUserInfoProps) => {
    try {
        const { database } = await createAdminClient();
        const user = await database.listDocuments(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            [Query.equal('userId', [userId])]
        )
        return parseStringify(user.documents[0])
    } catch (error) {
        console.log(error)
    }
}

// 3:05:35 sign-up

export const signIn = async ({ email, password }: signInProps) => {
    try {
        // Mutation / Database / make fetch 

        const { account } = await createAdminClient();

        const session = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true
        })

        const user = await getUserInfo({ userId: session.userId })

        return parseStringify(user);

    } catch (error) {
        console.log("error", error)
    }
}

// before the sign-in


export const signUp = async ({ password, ...userData }: SignUpParams) => {

    const { firstName, lastName, email } = userData;

    let newUserAccount;

    try {
        // create a user account
        const { account, database } = await createAdminClient();

        newUserAccount = await account.create(
            ID.unique(),
            email,
            password,
            `${firstName} ${lastName}`
        );

        if (!newUserAccount) throw new Error(`Error creating user`);

        const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
        })

        if (!dwollaCustomerUrl) throw new Error("Error creating dwolla customer");

        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)

        const newUser = await database.createDocument(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            ID.unique(),
            {
                ...userData,
                userId: newUserAccount.$id,
                dwollaCustomerId,
                dwollaCustomerUrl
            })

        const session = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify(newUser);
    } catch (error) {
        console.log("error", error)
    }
}
// ... your initilization functions


export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();

        const result = await account.get();

        const user = await getUserInfo({ userId: result.$id })

        return parseStringify(user);
    } catch (error) {
        console.log(error)
        return null;
    }
}


export const logoutAccount = async () => {
    try {
        const { account } = await createSessionClient()

        const cookieStore = await cookies();
        cookieStore.delete("appwrite-session");

        await account.deleteSession("current")
    } catch (error) {
        return null;
    }
}

export const createLinkToken = async (user: User) => {
    try {
        const tokenParams = {
            user: {
                client_user_id: user.$id,
            },
            client_name: `${user.firstName} ${user.lastName}`,
            products: ["auth", "transactions", "identity"] as Products[], // Add "transactions" to the products array
            language: "en",
            country_codes: ["US", "ES"] as CountryCode[],
            // update: { reauthorization_enabled: true }, // Enable reauthorization
        };


        const response = await plaidClient.linkTokenCreate(tokenParams)

        return parseStringify({ linkToken: response.data.link_token })
    } catch (error) {
        console.log(error);
    }
}

export const createBankAccount = async ({ userId, bankId, accountId, accessToken, fundingSourceUrl, shareableId }: createBankAccountProps) => {
    try {
        const { database } = await createAdminClient();
        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(),
            { userId, bankId, accountId, accessToken, fundingSourceUrl, shareableId }
        )

        return parseStringify(bankAccount);
    } catch (error) {
        console.log(error)
    }
}

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
    try {
        // Exchange public token for access token and item id
        const response = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken
        })

        // extracting the accessToken and item id from the response\
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // get account information from plaid using the access token
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken
        })

        // Extracting the account data form the response
        const accountData = accountsResponse.data.accounts[0];


        // Create a porcessor token for Dwolla using the access token and account id

        //1. this is the request token
        const request: ProcessorTokenCreateRequest = {
            access_token: accessToken,
            account_id: accountData.account_id,
            processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
        }

        //2. now processor token

        const processorTokenResponse = await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token;

        // creating a funding source url for the account using the dwolla custommer id, processor token and bank name

        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name,
        })

        // if the funding source url is not created , throw an error
        if (!fundingSourceUrl) throw Error;

        // Creating a bank account using the user id, item id , account id ,access token, funding source url ,and sharable id
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            shareableId: encryptId(accountData.account_id)
        })

        // Revalidate the path to reflec the changes
        revalidatePath("/");

        // Return a success messaage
        return parseStringify({
            publicTokenExchange: "complete"
        })
    } catch (error) {
        console.log("An error occurred while creating exhanging token:", error);
    }
}


// date - 12/04/25 video time 3:58:56 checking and configurring the exchangePublictoken function

export const getBanks = async ({ userId }: getBanksProps) => {
    try {
        const { database } = await createAdminClient();
        const banks = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('userId', [userId])]
        )
        return parseStringify(banks.documents)
    } catch (error) {
        console.log(error)
    }
}


export const getBank = async ({ documentId }: getBankProps) => {
    try {
        const { database } = await createAdminClient();
        const bank = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('$id', [documentId])]
        )
        return parseStringify(bank.documents[0])
    } catch (error) {
        console.log(error)
    }
}


export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
    try {
        const { database } = await createAdminClient();
        const bank = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('accountId', [accountId])]
        )

        if (bank.total !== 1) return null
        return parseStringify(bank.documents[0])
    } catch (error) {
        console.log(error)
    }
}