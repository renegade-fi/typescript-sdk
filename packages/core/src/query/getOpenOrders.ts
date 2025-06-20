import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetOpenOrdersErrorType,
    type GetOpenOrdersParameters,
    type GetOpenOrdersReturnType,
    getOpenOrders,
} from "../actions/getOpenOrders.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetOpenOrdersOptions = Evaluate<GetOpenOrdersParameters & ScopeKeyParameter>;

export function getOpenOrdersQueryOptions(
    config: Config | undefined,
    options: GetOpenOrdersOptions = {},
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getOpenOrders");
            const orders = await getOpenOrders(config, parameters);
            return orders ?? null;
        },
        queryKey: getOpenOrdersQueryKey(options),
    } as const satisfies QueryOptions<
        GetOpenOrdersQueryFnData,
        GetOpenOrdersErrorType,
        GetOpenOrdersData,
        GetOpenOrdersQueryKey
    >;
}

export type GetOpenOrdersQueryFnData = Evaluate<GetOpenOrdersReturnType>;

export type GetOpenOrdersData = GetOpenOrdersQueryFnData;

export function getOpenOrdersQueryKey(options: GetOpenOrdersOptions = {}) {
    return ["open-orders", filterQueryOptions(options)] as const;
}

export type GetOpenOrdersQueryKey = ReturnType<typeof getOpenOrdersQueryKey>;
