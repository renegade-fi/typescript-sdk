"use client"

import { useConfig } from "./useConfig.js"
import { useStatus } from "./useStatus.js"
import { useTaskHistoryWebSocket } from "./useTaskHistoryWebSocket.js"
import type { Config, TaskHistoryItem } from "@renegade-fi/core"
import { getTaskHistory } from "@renegade-fi/core"
import { useEffect, useState } from "react"

export type UseTaskHistoryParameters = {
    config?: Config
    sort?: "asc" | "desc"
}

export type UseTaskHistoryReturnType = TaskHistoryItem[]

export function useTaskHistory(
    parameters: UseTaskHistoryParameters = {},
): UseTaskHistoryReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const { sort } = parameters
    const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([])
    const incomingTask = useTaskHistoryWebSocket()

    useEffect(() => {
        if (status !== "in relayer") return

        async function fetchTaskHistory() {
            const initialTaskHistory = await getTaskHistory(config)
            setTaskHistory(initialTaskHistory)
        }

        fetchTaskHistory()
        // const interval = setInterval(fetchTaskHistory, config.pollingInterval)

        // return () => clearInterval(interval)
    }, [status, config])

    useEffect(() => {
        if (incomingTask) {
            setTaskHistory(prev => {
                const idx = prev.findIndex(task => task.id === incomingTask.id)
                if (idx !== -1) {
                    const newTaskHistory = [...prev]
                    newTaskHistory[idx] = incomingTask
                    return newTaskHistory
                }
                return [...prev, incomingTask]
            })
        }
    }, [incomingTask])

    if (sort) {
        taskHistory.sort((a, b) => {
            if (sort === "asc") {
                return a.created_at - b.created_at
            }
            return b.created_at - a.created_at
        })
    }

    return taskHistory
}
