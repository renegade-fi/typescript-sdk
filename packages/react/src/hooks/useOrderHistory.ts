"use client";

import type { Evaluate, GetOrderHistoryErrorType, OrderMetadata } from "@renegade-fi/core";
import {
    type GetOrderHistoryData,
    type GetOrderHistoryOptions,
    type GetOrderHistoryQueryFnData,
    type GetOrderHistoryQueryKey,
    getOrderHistoryQueryOptions,
} from "@renegade-fi/core/query";
import { useQueryClient } from "@tanstack/react-query";
import type { ConfigParameter, QueryParameter } from "../types/properties.js";
import { type UseQueryReturnType, useQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";
import { useOrderHistoryWebSocket } from "./useOrderHistoryWebSocket.js";
import { useStatus } from "./useStatus.js";

export type UseOrderHistoryParameters<selectData = GetOrderHistoryData> = Evaluate<
    GetOrderHistoryOptions &
        ConfigParameter &
        QueryParameter<
            GetOrderHistoryQueryFnData,
            GetOrderHistoryErrorType,
            selectData,
            GetOrderHistoryQueryKey
        >
>;

export type UseOrderHistoryReturnType<selectData = GetOrderHistoryData> = UseQueryReturnType<
    selectData,
    GetOrderHistoryErrorType
>;

export function useOrderHistory<selectData = GetOrderHistoryData>(
    parameters: UseOrderHistoryParameters<selectData> = {},
): UseOrderHistoryReturnType<selectData> {
    const { query = {} } = parameters;

    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const queryClient = useQueryClient();

    const options = getOrderHistoryQueryOptions(config, {
        ...parameters,
    });
    const enabled = Boolean(status === "in relayer" && (query.enabled ?? true));

    useOrderHistoryWebSocket({
        enabled,
        onUpdate: (incoming: OrderMetadata) => {
            if (queryClient && options.queryKey) {
                const existingMap =
                    queryClient.getQueryData<GetOrderHistoryData>(options.queryKey) || new Map();
                const existingOrder = existingMap.get(incoming.id);

                if (!existingOrder || incoming.state !== existingOrder.state) {
                    const newMap = new Map(existingMap);
                    newMap.set(incoming.id, incoming);
                    queryClient.setQueryData(options.queryKey, newMap);
                }
            }
        },
    });

    return useQuery({ ...query, ...options, enabled });
}
