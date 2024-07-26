"use client"

import type { Evaluate } from "@renegade-fi/core"
import { Token, parseAmount, stringifyForWasm } from "@renegade-fi/core"
import React from "react"
import { isAddress, toHex } from 'viem'
import type { BaseErrorType } from "../errors/base.js"
import type { ConfigParameter } from "../types/properties.js"
import { useConfig } from "./useConfig.js"
import { useWallet } from "./useWallet.js"

export type UsePrepareWithdrawParameters = Evaluate<
    {
        mint?: string
        amount?: number
        destinationAddr?: string
        enabled?: boolean
    } &
    ConfigParameter
>

export type UsePrepareWithdrawErrorType = BaseErrorType

export type UsePrepareWithdrawReturnType = {
    request: string
    mint: `0x${string}`
} | undefined

export function usePrepareWithdraw(parameters: UsePrepareWithdrawParameters): UsePrepareWithdrawReturnType {
    const { mint, amount, destinationAddr, enabled = true } = parameters
    const config = useConfig(parameters)
    const { data: wallet, isSuccess } = useWallet()

    const request = React.useMemo(() => {
        console.log("prepare withdrawal debug 1", { mint, amount, destinationAddr })
        if (!isSuccess || !mint || !amount || !destinationAddr || !enabled) return undefined
        console.log("prepare withdrawal debug 2", { mint, amount, destinationAddr })
        if (!isAddress(mint) || !isAddress(destinationAddr)) return undefined
        console.log("prepare withdrawal debug 3", { mint, amount, destinationAddr })

        const token = Token.findByAddress(mint)
        const parsedAmount = parseAmount(amount.toString(), token)

        console.log("prepare withdrawal debug 4", {
            wallet: stringifyForWasm(wallet),
            mint,
            parsedAmount,
            amount: toHex(parsedAmount),
            destinationAddr
        })

        return {
            request: config.utils.withdraw(
                stringifyForWasm(wallet),
                mint,
                toHex(parsedAmount),
                destinationAddr,
            ), mint
        }
    }, [config, wallet, mint, amount, destinationAddr, isSuccess, enabled])

    return request
}