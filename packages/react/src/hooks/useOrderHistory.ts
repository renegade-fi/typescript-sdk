"use client"

import { useConfig } from "./useConfig.js"
import { useOrderHistoryWebSocket } from "./useOrderHistoryWebSocket.js"
import type { Config, OrderMetadata } from "@renegade-fi/core"
import { getOrderHistory } from "@renegade-fi/core"
import { useEffect, useState } from "react"

import { useStatus } from "../index.js"

export type UseOrderHistoryParameters = {
    config?: Config
    sort?: "asc" | "desc"
}

export type UseOrderHistoryReturnType = OrderMetadata[]

export function useOrderHistory(
    parameters: UseOrderHistoryParameters = {},
): UseOrderHistoryReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const { sort } = parameters
    const [orderHistory, setOrderHistory] = useState<OrderMetadata[]>([])
    const incomingOrder = useOrderHistoryWebSocket()

    useEffect(() => {
        if (status !== "in relayer") return

        async function fetchOrderHistory() {
            const initialOrderHistory = await getOrderHistory(config)
            setOrderHistory(initialOrderHistory)
        }

        fetchOrderHistory()
        // const interval = setInterval(fetchOrderHistory, 5000)

        // return () => clearInterval(interval)
    }, [status, config])

    useEffect(() => {
        if (incomingOrder) {
            const idx = orderHistory.findIndex(order => order.id === incomingOrder.id)
            if (idx !== -1) {
                const newOrderHistory = [...orderHistory]
                newOrderHistory[idx] = incomingOrder
                setOrderHistory(newOrderHistory)
            } else {
                setOrderHistory([...orderHistory, incomingOrder])
            }
        }
    }, [incomingOrder])

    if (sort) {
        orderHistory.sort((a, b) => {
            if (sort === "asc") {
                return a.created - b.created
            } else {
                return b.created - a.created
            }
        })
    }

    return orderHistory
}
