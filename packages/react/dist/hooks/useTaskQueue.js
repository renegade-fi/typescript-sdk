"use client";
import { useConfig } from "./useConfig.js";
import { getTaskQueue } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useStatus } from "../index.js";
export function useTaskQueue(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const [taskQueue, setTaskQueue] = useState([]);
    useEffect(() => {
        if (status !== "in relayer")
            return;
        async function fetchTaskQueue() {
            const initialTaskQueue = await getTaskQueue(config);
            setTaskQueue(initialTaskQueue);
        }
        fetchTaskQueue();
        const interval = setInterval(async () => {
            const updatedTaskQueue = await getTaskQueue(config);
            setTaskQueue(updatedTaskQueue);
        }, 5000);
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [status]);
    return taskQueue;
}
//# sourceMappingURL=useTaskQueue.js.map