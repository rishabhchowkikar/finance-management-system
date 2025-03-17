"use client";
import React from 'react'
import Countup from "react-countup"

const AnimatedCountup = ({ amount }: { amount: number }) => {
    return (
        <div>
            <Countup end={amount} decimal="," prefix='$' duration={2.75} />
        </div>
    )
}

export default AnimatedCountup
