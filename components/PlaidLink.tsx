import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { Button } from './ui/button'

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {

    const router = useRouter();

    const [token, setToken] = useState('');

    useEffect(() => {
        const getLinkToken = async () => {
            const data = await createLinkToken(user)

            setToken(data?.linkToken);
        }
        getLinkToken();
    }, [user]);

    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
        await exchangePublicToken({
            publicToken: public_token,
            user,
        })

        // after exchanging the public token pushing the user to the home page
        router.push("/");
    }, [user]);


    const config: PlaidLinkOptions = {
        token,
        onSuccess
    }

    const { open, ready } = usePlaidLink(config)
    return (
        <>
            {variant === "primary" ? (
                <Button
                    className='plaidlink-primary'
                    onClick={() => open()}
                    disabled={!ready}
                >Connect Bank</Button>
            ) : variant === "ghost" ? (
                <Button
                    className='plaidlink-ghost'
                    variant="ghost"
                    onClick={() => open()}
                >
                    <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
                    <p className='hidden text-[16px] font-semibold text-black-2 xl:block'>Connect Bank</p>
                </Button>
            ) : (
                <Button
                    className='plaidlink-default'
                    onClick={() => open()}
                >
                    <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
                    <p className='text-[16px] font-semibold text-black-2'>Connect Bank</p>
                </Button>
            )}
        </>
    )
}

export default PlaidLink;

// 3:46:40 // implemented the sentry and implementing plaid button setup