"use client"

import { useBalances } from "./useBalances.js"
import type { Config } from "@renegade-fi/core"

export type UseFeesParameters = {
    config?: Config
    filter?: boolean
}

export type UseFeesReturnType = {
    protocol: bigint
    relayer: bigint
}[]

export function useFees(parameters: UseFeesParameters = {}): UseFeesReturnType {
    const { filter = true } = parameters
    const balances = useBalances({ filter: false })

    const fees = balances.map(balance => {
        return {
            protocol: balance.protocol_fee_balance,
            relayer: balance.relayer_fee_balance,
        }
    })

    if (filter) {
        return fees.filter(fee => fee.protocol && fee.relayer)
    }

    return fees
}
