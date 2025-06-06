import { formatAmount } from '@/lib/utils'
import CountUp from "react-countup"
import React from 'react'
import AnimatedCountup from './AnimatedCountup'
import DoughnutChart from './DoughnutChart'

const TotalBalanceBox = ({ accounts = [], totalBanks, totalCurrentBalance }: TotlaBalanceBoxProps) => {
    return (
        <section className='total-balance'>
            <div className='total-balance-chart'>

                <DoughnutChart accounts={accounts} />

            </div>
            <div className='flex flex-col gap-6'>
                <h2 className='header-2'>
                    Bank Accounts: {totalBanks}
                </h2>
                <div className='flex flex-col gap-2'>
                    <p className='total-balance-label'>Total Current Balance</p>
                    <div className="total-balance-amount placeholder flex-start gap-2" >
                        <AnimatedCountup amount={totalCurrentBalance} />
                    </div>
                </div>
            </div>
        </section >
    )
}

export default TotalBalanceBox
