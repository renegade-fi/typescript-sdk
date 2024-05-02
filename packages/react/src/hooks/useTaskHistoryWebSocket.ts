"use client"

import { useConfig } from "./useConfig.js"
import {
    type Config,
    RENEGADE_AUTH_HEADER_NAME,
    RENEGADE_SIG_EXPIRATION_HEADER_NAME,
    type Task,
    WS_TASK_HISTORY_ROUTE,
} from "@renegade-fi/core"
import JSONBigint from "json-bigint"
import { useEffect, useState } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"

import { getSkRoot, useStatus, useWalletId } from "../index.js"

export type UseTaskHistoryWebSocketParameters = {
    config?: Config
    taskId?: string
}

export type UseTaskHistoryWebSocketReturnType = Task | undefined

export function useTaskHistoryWebSocket(
    parameters: UseTaskHistoryWebSocketParameters = {},
): UseTaskHistoryWebSocketReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const walletId = useWalletId()
    const { getWebsocketBaseUrl } = config
    // TODO: Proper type
    const [taskHistory, setTaskHistory] = useState<Task>()

    const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(
        getWebsocketBaseUrl(),
        {
            share: true,
            shouldReconnect: () => true,
        },
    )

    // Subscribe to wallet updates with auth headers
    useEffect(() => {
        if (!walletId || readyState !== ReadyState.OPEN || status !== "in relayer") return

        const body = {
            method: "subscribe",
            topic: WS_TASK_HISTORY_ROUTE(walletId),
        }
        const skRoot = getSkRoot(config)
        const [auth, expiration] = config.utils.build_auth_headers(
            skRoot,
            JSON.stringify(body),
            BigInt(Date.now()),
        )
        const message = {
            headers: {
                [RENEGADE_AUTH_HEADER_NAME]: auth,
                [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
            },
            body,
        }
        sendJsonMessage(message)
    }, [readyState, status, sendJsonMessage, config, walletId])

    useEffect(() => {
        if (lastMessage && walletId) {
            try {
                const messageData = JSONBigint({ useNativeBigInt: true }).parse(lastMessage.data)
                if (
                    messageData.topic === WS_TASK_HISTORY_ROUTE(walletId) &&
                    messageData.event?.type === "TaskHistoryUpdate" &&
                    messageData.event?.task
                )
                    setTaskHistory(messageData.event.task)
            } catch (error) {
                console.error("Error parsing data in WebSocket:", lastMessage.data, error)
            }
        }
    }, [lastMessage, walletId])

    return taskHistory
}
