'use server';
import { cookies } from "next/headers";
import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { parseStringify } from "../utils";


// 3:05:35 sign-up

export const signIn = async ({ email, password }: signInProps) => {
    try {
        // Mutation / Database / make fetch 

        const { account } = await createAdminClient();

        const response = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();
        cookieStore.set("appwrite-session", response.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true
        })

        return parseStringify(response);

    } catch (error) {
        console.log("error", error)
    }
}

// before the sign-in


export const signUp = async (userData: SignUpParams) => {

    const { firstName, lastName, password, email } = userData;
    try {
        // create a user account
        const { account } = await createAdminClient();

        const newUserAccount = await account.create(
            ID.unique(),
            email,
            password,
            `${firstName} ${lastName}`
        );

        const session = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify(newUserAccount);
    } catch (error) {
        console.log("error", error)
    }
}
// ... your initilization functions


export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();

        const user = await account.get();

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