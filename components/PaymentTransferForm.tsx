"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { createTransfer } from "@/lib/actions/dwolla.actions";
import { createTransaction } from "@/lib/actions/transaction.actions";
import { getBank, getBankByAccountId } from "@/lib/actions/user.actions";
import { decryptId } from "@/lib/utils";

import { BankDropdown } from "./BankDropdown";
import { Button } from "./ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import PaymentQRScanner from "./PaymentQRScanner";

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(4, "Transfer note is too short"),
    amount: z.string().min(4, "Amount is too short"),
    senderBank: z.string().min(4, "Please select a valid bank account"),
    sharableId: z.string().min(8, "Please select a valid sharable Id"),
});

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [scannedData, setScannedData] = useState<{
        shareableId: string;
        cardName: string;
        userName: string;
        userEmail: string;
    } | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            amount: "",
            senderBank: "",
            sharableId: "",
        },
    });

    const handleQRScan = (data: {
        shareableId: string;
        cardName: string;
        userName: string;
        userEmail: string;
    }) => {
        setScannedData(data);
        form.setValue('sharableId', data.shareableId);
        form.setValue('email', data.userEmail);
        form.setValue('name', `Transfer to ${data.cardName}`);
    };

    const submit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const receiverAccountId = decryptId(data.sharableId);
            const receiverBank = await getBankByAccountId({
                accountId: receiverAccountId,
            });
            const senderBank = await getBank({ documentId: data.senderBank });

            const transferParams = {
                sourceFundingSourceUrl: senderBank.fundingSourceUrl,
                destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
                amount: data.amount,
            };
            // create transfer
            const transfer = await createTransfer(transferParams);

            // create transfer transaction
            if (transfer) {
                const transaction = {
                    name: data.name,
                    amount: data.amount,
                    senderId: senderBank.userId.$id,
                    senderBankId: senderBank.$id,
                    receiverId: receiverBank.userId.$id,
                    receiverBankId: receiverBank.$id,
                    email: data.email,
                };

                const newTransaction = await createTransaction(transaction);

                if (newTransaction) {
                    form.reset();
                    router.push("/");
                }
            }
        } catch (error) {
            console.error("Submitting create transfer request failed: ", error);
        }

        setIsLoading(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
                <FormField
                    control={form.control}
                    name="senderBank"
                    render={() => (
                        <FormItem className="border-t border-gray-200">
                            <div className="payment-transfer_form-item pb-6 pt-5">
                                <div className="payment-transfer_form-content">
                                    <FormLabel className="text-14 font-medium text-gray-700">
                                        Select Source Bank
                                    </FormLabel>
                                    <FormDescription className="text-12 font-normal text-gray-600">
                                        Select the bank account you want to transfer funds from
                                    </FormDescription>
                                </div>
                                <div className="flex w-full flex-col">
                                    <FormControl>
                                        <BankDropdown
                                            accounts={accounts}
                                            setValue={form.setValue}
                                            otherStyles="!w-full"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-12 text-red-500" />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                {/* QR Scanner Section */}
                <div className="border-t border-gray-200 py-5">
                    <div className="payment-transfer_form-item">
                        <div className="mb-4">
                            <FormLabel className="text-14 font-medium text-gray-700">
                                Recipient Details
                            </FormLabel>
                            <FormDescription className="text-12 font-normal text-gray-600">
                                Scan QR code to automatically fill recipient details
                            </FormDescription>
                        </div>

                        <PaymentQRScanner onScan={handleQRScan} />
                    </div>
                    {scannedData && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                    <span className="text-sm font-medium text-green-800">QR Code Scanned Successfully</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Recipient:</span> {scannedData.userName}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Email:</span> {scannedData.userEmail}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Account:</span> {scannedData.cardName}
                                    </p>
                                </div>
                            </div>
                        )}
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="border-t border-gray-200">
                            <div className="payment-transfer_form-item pb-6 pt-5">
                                <div className="payment-transfer_form-content">
                                    <FormLabel className="text-14 font-medium text-gray-700">
                                        Transfer Note (Optional)
                                    </FormLabel>
                                    <FormDescription className="text-12 font-normal text-gray-600">
                                        Please provide any additional information or instructions
                                        related to the transfer
                                    </FormDescription>
                                </div>
                                <div className="flex w-full flex-col">
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write a short note here"
                                            className="input-class"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-12 text-red-500" />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="payment-transfer_form-details">
                    <h2 className="text-18 font-semibold text-gray-900">
                        Bank account details
                    </h2>
                    <p className="text-16 font-normal text-gray-600">
                        Enter the bank account details of the recipient
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="border-t border-gray-200">
                            <div className="payment-transfer_form-item py-5">
                                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                                    Recipient&apos;s Email Address
                                </FormLabel>
                                <div className="flex w-full flex-col">
                                    <FormControl>
                                        <Input
                                            placeholder="ex: johndoe@gmail.com"
                                            className="input-class"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-12 text-red-500" />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sharableId"
                    render={({ field }) => (
                        <FormItem className="border-t border-gray-200">
                            <div className="payment-transfer_form-item pb-5 pt-6">
                                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                                    Receiver&apos;s Plaid Sharable Id
                                </FormLabel>
                                <div className="flex w-full flex-col">
                                    <FormControl>
                                        <Input
                                            placeholder="Enter the public account number"
                                            className="input-class"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-12 text-red-500" />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="border-y border-gray-200">
                            <div className="payment-transfer_form-item py-5">
                                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                                    Amount
                                </FormLabel>
                                <div className="flex w-full flex-col">
                                    <FormControl>
                                        <Input
                                            placeholder="ex: 5.00"
                                            className="input-class"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-12 text-red-500" />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="payment-transfer_btn-box">
                    <Button type="submit" className="payment-transfer_btn">
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> &nbsp; Sending...
                            </>
                        ) : (
                            "Transfer Funds"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default PaymentTransferForm;