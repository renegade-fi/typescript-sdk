"use client"

import { useConfig } from "./useConfig.js"
import type { Config, OldTask as Task } from "@renegade-fi/core"
import { getTaskQueue } from "@renegade-fi/core"
import { useEffect, useState } from "react"

import { useStatus } from "../index.js"

export type UseTaskQueueParameters = {
    config?: Config
}

export type UseTaskQueueReturnType = Task[]

export function useTaskQueue(parameters: UseTaskQueueParameters = {}): UseTaskQueueReturnType {
    const config = useConfig(parameters)
    const status = useStatus(parameters)
    const [taskQueue, setTaskQueue] = useState<Task[]>([])

    useEffect(() => {
        if (status !== "in relayer") return

        async function fetchTaskQueue() {
            const initialTaskQueue = await getTaskQueue(config)
            setTaskQueue(initialTaskQueue)
        }

        fetchTaskQueue()

        const interval = setInterval(async () => {
            const updatedTaskQueue = await getTaskQueue(config)
            setTaskQueue(updatedTaskQueue)
        }, 5000)

        return () => clearInterval(interval) // Cleanup interval on component unmount
    }, [status])

    return taskQueue
}
