"use client";

import type { Evaluate, GetTaskHistoryErrorType, Task } from "@renegade-fi/core";
import {
    type GetTaskHistoryData,
    type GetTaskHistoryOptions,
    type GetTaskHistoryQueryFnData,
    type GetTaskHistoryQueryKey,
    getTaskHistoryQueryOptions,
} from "@renegade-fi/core/query";
import { useQueryClient } from "@tanstack/react-query";
import type { ConfigParameter, QueryParameter } from "../types/properties.js";
import { type UseQueryReturnType, useQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";
import { useStatus } from "./useStatus.js";
import { useTaskHistoryWebSocket } from "./useTaskHistoryWebSocket.js";

export type UseTaskHistoryParameters<selectData = GetTaskHistoryData> = Evaluate<
    GetTaskHistoryOptions &
        ConfigParameter &
        QueryParameter<
            GetTaskHistoryQueryFnData,
            GetTaskHistoryErrorType,
            selectData,
            GetTaskHistoryQueryKey
        >
>;

export type UseTaskHistoryReturnType<selectData = GetTaskHistoryData> = UseQueryReturnType<
    selectData,
    GetTaskHistoryErrorType
>;

export function useTaskHistory<selectData = GetTaskHistoryData>(
    parameters: UseTaskHistoryParameters<selectData> = {},
): UseTaskHistoryReturnType<selectData> {
    const { query = {} } = parameters;

    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const queryClient = useQueryClient();

    const options = getTaskHistoryQueryOptions(config, {
        ...parameters,
    });
    const enabled = Boolean(status === "in relayer" && (query.enabled ?? true));

    useTaskHistoryWebSocket({
        enabled,
        onUpdate: (incoming: Task) => {
            if (queryClient && options.queryKey) {
                const existingMap =
                    queryClient.getQueryData<GetTaskHistoryData>(options.queryKey) || new Map();
                const existingTask = existingMap.get(incoming.id);

                if (!existingTask || incoming.state !== existingTask.state) {
                    const newMap = new Map(existingMap);
                    newMap.set(incoming.id, incoming);
                    queryClient.setQueryData(options.queryKey, newMap);
                }
            }
        },
    });

    return useQuery({ ...query, ...options, enabled });
}
