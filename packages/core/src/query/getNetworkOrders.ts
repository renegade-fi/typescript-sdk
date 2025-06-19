import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetNetworkOrdersErrorType,
    type GetNetworkOrdersReturnType,
    getNetworkOrders,
} from "../actions/getNetworkOrders.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { type ScopeKeyParameter, filterQueryOptions } from "./utils.js";

export type GetNetworkOrdersOptions = Evaluate<ScopeKeyParameter>;

export function getNetworkOrdersQueryOptions(
    config: Config | undefined,
    options: GetNetworkOrdersOptions = {},
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _ } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getNetworkOrders");
            const history = await getNetworkOrders(config);
            return history ?? null;
        },
        queryKey: getNetworkOrdersQueryKey(options),
    } as const satisfies QueryOptions<
        GetNetworkOrdersQueryFnData,
        GetNetworkOrdersErrorType,
        GetNetworkOrdersData,
        GetNetworkOrdersQueryKey
    >;
}

export type GetNetworkOrdersQueryFnData = Evaluate<GetNetworkOrdersReturnType>;

export type GetNetworkOrdersData = GetNetworkOrdersQueryFnData;

export function getNetworkOrdersQueryKey(options: GetNetworkOrdersOptions = {}) {
    return ["network-orders", filterQueryOptions(options)] as const;
}

export type GetNetworkOrdersQueryKey = ReturnType<typeof getNetworkOrdersQueryKey>;
