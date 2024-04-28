"use client"

import { useConfig } from "./useConfig.js"
import {
    type Config,
    RENEGADE_AUTH_HEADER_NAME,
    RENEGADE_SIG_EXPIRATION_HEADER_NAME,
    TASK_STATUS_ROUTE,
    type Task,
} from "@renegade-fi/core"
import JSONBigint from "json-bigint"
import { useEffect, useRef, useState } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"

import { getSkRoot, useStatus, useWalletId } from "../index.js"

export type UseTaskStatusParameters = {
    config?: Config
    taskId?: string
}

export type UseTaskStatusReturnType = Task | undefined

export function useTaskStatus(parameters: UseTaskStatusParameters): UseTaskStatusReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const walletId = useWalletId()
    const { getWebsocketBaseUrl } = config
    const { taskId } = parameters
    const [task, setTask] = useState<Task>()

    const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(
        getWebsocketBaseUrl(),
        {
            share: true,
            shouldReconnect: () => true,
        },
    )

    const isSubscribed = useRef(false)

    // Reset subscription flag when walletId changes
    useEffect(() => {
        isSubscribed.current = false
    }, [walletId])

    // Subscribe to wallet updates with auth headers
    useEffect(() => {
        if (
            !taskId ||
            readyState !== ReadyState.OPEN ||
            status !== "in relayer" ||
            isSubscribed.current
        )
            return

        const body = {
            method: "subscribe",
            topic: TASK_STATUS_ROUTE(taskId),
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
        isSubscribed.current = true
    }, [readyState, taskId, status, sendJsonMessage, config])

    useEffect(() => {
        if (lastMessage && taskId) {
            try {
                const messageData = JSONBigint({ useNativeBigInt: true }).parse(lastMessage.data)
                if (
                    messageData.topic === TASK_STATUS_ROUTE(taskId) &&
                    messageData.event?.type === "TaskStatusUpdate" &&
                    messageData.event?.status
                )
                    setTask(messageData.event.status as Task)
            } catch (error) {
                console.error("Error parsing data in WebSocket:", lastMessage.data, error)
            }
        }
    }, [lastMessage, taskId])

    return task
}
