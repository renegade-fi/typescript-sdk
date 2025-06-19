import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetOrderHistoryErrorType,
    type GetOrderHistoryParameters,
    type GetOrderHistoryReturnType,
    getOrderHistory,
} from "../actions/getOrderHistory.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetOrderHistoryOptions = Evaluate<GetOrderHistoryParameters & ScopeKeyParameter>;

export function getOrderHistoryQueryOptions(
    config: Config | undefined,
    options: GetOrderHistoryOptions = {},
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getOrderHistory");
            const history = await getOrderHistory(config, parameters);
            return history ?? null;
        },
        queryKey: getOrderHistoryQueryKey({
            scopeKey: config?.state.id,
            ...options,
        }),
    } as const satisfies QueryOptions<
        GetOrderHistoryQueryFnData,
        GetOrderHistoryErrorType,
        GetOrderHistoryData,
        GetOrderHistoryQueryKey
    >;
}

export type GetOrderHistoryQueryFnData = Evaluate<GetOrderHistoryReturnType>;

export type GetOrderHistoryData = GetOrderHistoryQueryFnData;

export function getOrderHistoryQueryKey(options: GetOrderHistoryOptions = {}) {
    return ["order-history", filterQueryOptions(options)] as const;
}

export type GetOrderHistoryQueryKey = ReturnType<typeof getOrderHistoryQueryKey>;
