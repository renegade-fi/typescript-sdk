"use client"

import type { Evaluate } from "@renegade-fi/core"
import { stringifyForWasm } from "@renegade-fi/core"
import type { CancelOrderParameters } from "@renegade-fi/core/actions"
import React from "react"
import type { BaseErrorType } from "../errors/base.js"
import type { ConfigParameter } from "../types/properties.js"
import { useConfig } from "./useConfig.js"
import { useWallet } from "./useWallet.js"

export type UsePrepareCancelOrderParameters = Evaluate<
    CancelOrderParameters &
    ConfigParameter
>

export type UsePrepareCancelOrderErrorType = BaseErrorType

export type UsePrepareCancelOrderReturnType = {
    request: string | undefined
}

export function usePrepareCancelOrder(parameters: UsePrepareCancelOrderParameters) {
    const { id } = parameters
    const config = useConfig(parameters)
    const { data: wallet, isSuccess } = useWallet()
    const request = React.useMemo(() => {
        if (!isSuccess) return ""
        if (wallet.orders.find(order => order.id === id)) {
            return config.utils.cancel_order(
                stringifyForWasm(wallet),
                id,
            )
        }
        return undefined
    }, [config, wallet, id, isSuccess])
    return { request }
}