"use client"

import { useConfig } from "./useConfig.js"
import { useStatus } from "./useStatus.js"
import { useTaskHistoryWebSocket } from "./useTaskHistoryWebSocket.js"
import type { Config, Task } from "@renegade-fi/core"
import { getTaskHistory } from "@renegade-fi/core"
import { useEffect, useState } from "react"

export type UseTaskHistoryParameters = {
    config?: Config
    sort?: "asc" | "desc"
}

export type UseTaskHistoryReturnType = Task[]

export function useTaskHistory(
    parameters: UseTaskHistoryParameters = {},
): UseTaskHistoryReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const { sort } = parameters
    const [taskHistory, setTaskHistory] = useState<Map<string, Task>>(new Map())
    const incomingTask = useTaskHistoryWebSocket()

    useEffect(() => {
        if (status !== "in relayer") return

        async function fetchTaskHistory() {
            const initialTaskHistory = await getTaskHistory(config)
            const taskMap = new Map(initialTaskHistory.map(task => [task.id, task]))
            setTaskHistory(taskMap)
        }

        fetchTaskHistory()
        // const interval = setInterval(fetchTaskHistory, config.pollingInterval)

        // return () => clearInterval(interval)
    }, [status, config])

    useEffect(() => {
        if (incomingTask) {
            setTaskHistory(prev => new Map(prev).set(incomingTask.id, incomingTask))
        }
    }, [incomingTask])

    const sortedTaskHistory = Array.from(taskHistory.values())
    if (sort) {
        sortedTaskHistory.sort((a, b) => {
            if (sort === "asc") {
                return a.created_at - b.created_at
            }
            return b.created_at - a.created_at
        })
    }

    return sortedTaskHistory
}
