"use client"

import type { Evaluate } from "@renegade-fi/core"
import { Token, parseAmount, stringifyForWasm } from "@renegade-fi/core"
import React from "react"
import { isAddress, isHex, toHex } from 'viem'
import type { BaseErrorType } from "../errors/base.js"
import type { ConfigParameter } from "../types/properties.js"
import { useConfig } from "./useConfig.js"
import { useWallet } from "./useWallet.js"

export type UsePrepareDepositParameters = Evaluate<
    {
        amount?: number | bigint
        fromAddr?: string
        mint?: string
        permit?: `0x${string}`
        permitDeadline?: bigint
        permitNonce?: bigint
    } &
    ConfigParameter
>

export type UsePrepareDepositErrorType = BaseErrorType

export type UsePrepareDepositReturnType = {
    request: string | undefined
}

export function usePrepareDeposit(parameters: UsePrepareDepositParameters) {
    const { amount, fromAddr, mint, permit, permitDeadline, permitNonce } = parameters
    const config = useConfig(parameters)
    const { data: wallet, isSuccess } = useWallet()
    const request = React.useMemo(() => {
        if (!isSuccess) return undefined
        if (!amount || !fromAddr || !mint || !permit || !permitDeadline || !permitNonce) return undefined
        if (!isAddress(mint) || !isAddress(fromAddr) || !isHex(permit)) return undefined

        const token = Token.findByAddress(mint)
        let parsedAmount: bigint
        if (typeof amount === "number") {
            parsedAmount = parseAmount(amount.toString(), token)
        } else {
            parsedAmount = amount
        }


        return config.utils.deposit(
            stringifyForWasm(wallet),
            fromAddr,
            mint,
            toHex(parsedAmount),
            toHex(permitNonce),
            toHex(permitDeadline),
            permit,

        )
    }, [config, wallet, fromAddr, mint, amount, permitNonce, permitDeadline, permit, isSuccess])
    return { request }
}