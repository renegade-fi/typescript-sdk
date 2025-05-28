"use client";

import type { Evaluate, GetWalletErrorType } from "@renegade-fi/core";
import {
    type GetWalletData,
    type GetWalletOptions,
    type GetWalletQueryFnData,
    type GetWalletQueryKey,
    getWalletQueryOptions,
} from "@renegade-fi/core/query";
import { useQueryClient } from "@tanstack/react-query";
import type { ConfigParameter, QueryParameter } from "../types/properties.js";
import { type UseQueryReturnType, useQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";
import { useStatus } from "./useStatus.js";
import { useWalletWebsocket } from "./useWalletWebSocket.js";

export type UseWalletParameters<selectData = GetWalletData> = Evaluate<
    GetWalletOptions &
        ConfigParameter &
        QueryParameter<GetWalletQueryFnData, GetWalletErrorType, selectData, GetWalletQueryKey>
>;

export type UseWalletReturnType<selectData = GetWalletData> = UseQueryReturnType<
    selectData,
    GetWalletErrorType
>;

export function useWallet<selectData = GetWalletData>(
    parameters: UseWalletParameters<selectData> = {},
): UseWalletReturnType<selectData> {
    const { filterDefaults, query = {} } = parameters;

    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const queryClient = useQueryClient();

    const options = getWalletQueryOptions(config, {
        ...parameters,
        filterDefaults,
    });
    const enabled = Boolean(
        status === "in relayer" && config?.state.seed && (query.enabled ?? true),
    );

    useWalletWebsocket({
        enabled,
        onUpdate: (wallet) => {
            if (wallet && queryClient && options.queryKey) {
                queryClient.setQueryData(options.queryKey, wallet);
            }
        },
    });

    return useQuery({ ...query, ...options, enabled });
}
