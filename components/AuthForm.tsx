"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'


// shadcn form component 

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
} from "@/components/ui/form"
import CustomInput from './CustomInput'
import { authFormSchema } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/user.actions'
import PlaidLink from './PlaidLink'
// import SignUp from '@/app/(auth)/sign-up/page'

const AuthForm = ({ type }: { type: string }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const formSchema = authFormSchema(type);


    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    // 2. Define a submit handler.
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            // Sign up with appwrite & create plaid token
            const userData = {
                firstName: data.firstName!,
                lastName: data.lastName!,
                address1: data.address1!,
                city: data.city!,
                state: data.state!,
                postalCode: data.postalCode!,
                dateOfBirth: data.dateOfBirth!,
                ssn: data.ssn!,
                email: data.email,
                password: data.password
            }

            if (type === "sign-up") {
                const newUser = await signUp(userData);
                setUser(newUser)
            }

            if (type === "sign-in") {

                const response = await signIn({
                    email: data.email,
                    password: data.password
                });
                if (response) router.push("/")
            }

        } catch (error) {
            console.log(error)
        }
        finally {
            setIsLoading(false);
        }
        // after actions 
    }

    return (
        <section className='auth-form'>
            <header className='flex flex-col gap-5 md:gap-8'>
                <Link href="/" className='flex cursor-pointer items-center gap-1'>
                    <Image src="/icons/logo.svg" width={34} height={34} draggable={false} alt="Horizon Logo" />
                    <h1 className='text-26 font-ibm-plex-serif font-bold text-black-1'>Horizon</h1>
                </Link>

                <div className='flex flex-col gap-1 md:gap-3'>
                    <h1 className='text-24 lg:text-36 font-semibold text-gray-900'>
                        {user ? "Link Account" : type === "sign-in" ? "Sign In" : "Sign Up"}
                        <p className='text-16 font-normal text-gray-600'>
                            {user ? "Link Your account to get started" : "Please enter your Details"}
                        </p>
                    </h1>
                </div>
            </header>
            {user ? (
                <div className='flex flex-col gap-4'>
                    {/* PlaidLink */}
                    <PlaidLink user={user} variant="primary" />
                </div>
            ) : (
                <>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {type === "sign-up" && (
                                <>
                                    <div className='flex justify-between gap-3'>
                                        <CustomInput control={form.control} name="firstName" label="First Name" placeholder="Enter your First Name" />
                                        <CustomInput control={form.control} name="lastName" label="last Name" placeholder="Enter your Last Name" />
                                    </div>
                                    <CustomInput control={form.control} name="address1" label="Address" placeholder="Enter your specific address" />
                                    <CustomInput control={form.control} name="city" label="City" placeholder="Enter your City Name" />

                                    <div className='flex justify-between gap-3'>
                                        <CustomInput control={form.control} name="state" label="State" placeholder="Example: HR" />
                                        <CustomInput control={form.control} name="postalCode" label="Postal Code" placeholder="Example: 123401" />
                                    </div>
                                    <div className='flex justify-between gap-3'>
                                        <CustomInput control={form.control} name="dateOfBirth" label="Date of Birth" placeholder="Example: YYYY-MM-DD" />
                                        <CustomInput control={form.control} name="ssn" label="SSN" placeholder="Example: 1234" />
                                    </div>
                                </>
                            )}
                            <CustomInput control={form.control} name="email" label="Email" placeholder="Enter your Email" />

                            <CustomInput control={form.control} name="password" label="Password" placeholder="Enter your Password" />

                            <div className='flex flex-col gap-4'>
                                <Button type="submit" disabled={isLoading} className='form-btn' >{isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> &nbsp; Loading...
                                    </>
                                ) : type === "sign-in" ? "Sign In" : "Sign Up"}</Button>
                            </div>
                        </form>
                    </Form>
                    <footer className='flex justify-center gap-1'>
                        <p className='text-14 font-normal text-gray-600'>{type === "sign-in" ? "Don't have an account?" : "Already have an account?"}</p>
                        <Link href={type === "sign-in" ? "/sign-up" : "/sign-in"} className="form-link" >{type === "sign-in" ? "Sign Up" : "Sign In"}</Link>

                    </footer>
                </>
            )}
        </section>
    )
}

export default AuthForm

// 3:07:46 (continue from here) - {sign-in is not working}

// 3:25:03 (sentry setup working)

// sign-in functionality is now fixed