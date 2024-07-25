"use client"

import type { CreateOrderParameters, Evaluate } from "@renegade-fi/core"
import { stringifyForWasm } from "@renegade-fi/core"
import React from "react"
import { toHex } from 'viem'
import type { BaseErrorType } from "../errors/base.js"
import type { ConfigParameter } from "../types/properties.js"
import { useConfig } from "./useConfig.js"
import { useWallet } from "./useWallet.js"

export type UsePrepareCreateOrderParameters = Evaluate<
    CreateOrderParameters &
    ConfigParameter
>

export type UsePrepareCreateOrderErrorType = BaseErrorType

export type UsePrepareCreateOrderReturnType = {
    request: string
}

export function usePrepareCreateOrder(parameters: UsePrepareCreateOrderParameters) {
    const { id = '', base, quote, side, amount } = parameters
    const config = useConfig(parameters)
    const { data: wallet, isSuccess } = useWallet()
    const request = React.useMemo(() => {
        if (!isSuccess) return ""
        return config.utils.new_order(
            stringifyForWasm(wallet),
            id,
            base,
            quote,
            side,
            toHex(amount),
        )
    }, [config, wallet, id, base, quote, side, amount, isSuccess])
    return { request }
}