import React from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn, formatAmount, formatDateTime, getTransactionStatus, removeSpecialCharacters } from '@/lib/utils'
import { transactionCategoryStyles } from '@/constants'


const CategoryBadge = ({ category }: CategoryBadgeProps) => {
    const { borderColor, backgroundColor, chipBackgroundColor, textColor } = transactionCategoryStyles[category as keyof
        typeof transactionCategoryStyles] || transactionCategoryStyles.default
    return (
        <div className={cn('category-badge', borderColor, chipBackgroundColor)}>
            <div className={cn('size-2 rounded-full', backgroundColor)} />
            <p className={cn('text-[12px] font-medium', textColor)}>{category}</p>
        </div>
    )
}


const TransactionsTable = ({ transactions }: TransactionTableProps) => {
    return (
        <Table>
            <TableHeader className='bg-[#f9fafb]'>
                <TableRow>
                    <TableHead className="px-2">Transactions</TableHead>
                    <TableHead className="px-2">Amount</TableHead>
                    <TableHead className="px-2">Status</TableHead>
                    <TableHead className="px-2">Date</TableHead>
                    <TableHead className="px-2 max-md:hidden">Channel</TableHead>
                    <TableHead className="px-2 max-md:hidden">Category</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((t: Transaction) => {
                    const status = getTransactionStatus(new Date(t.date));
                    const amount = formatAmount(t.amount)

                    const isDebit = t.type === "debit";
                    const isCredit = t.type === "credit";

                    return (
                        <TableRow key={t.id} className={`${isDebit || amount[0] === "-" ? "bg-[#fffbfa]" : "bg-[#f6fef9]"} !over:bg-none !border-b-default`}>
                            <TableCell className='max-w-[250px] pl-2 pr-2'>
                                <div className='flex items-center gap-3'>
                                    <h1 className='text-14 truncate font-semibold text-[#344054]'>{removeSpecialCharacters(t.name)}</h1>
                                </div>
                            </TableCell>
                            <TableCell className={`pl-2 pr-2 font-semibold ${isDebit || amount[0] === "-" ? "text-[#f04438]" : "text-[#039855]"}`}>
                                {isDebit ? `-${amount}` : isCredit ? amount : amount}
                            </TableCell>

                            <TableCell className='pl-2 pr-2'>
                                <CategoryBadge category={status} />
                            </TableCell>

                            <TableCell className='min-w-32 pl-2 pr-2'>{formatDateTime(new Date(t.date)).dateTime}</TableCell>
                            <TableCell className='pl-2 pr-2 capitalize min-w-24 max-md:hidden'>{t.paymentChannel}</TableCell>

                            <TableCell className='pl-2 pr-2 max-md:hidden'>
                                <CategoryBadge category={t.category} />
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table >

    )
}

export default TransactionsTable