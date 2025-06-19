import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetOrderMetadataErrorType,
    type GetOrderMetadataParameters,
    type GetOrderMetadataReturnType,
    getOrderMetadata,
} from "../actions/getOrderMetadata.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetOrderMetadataOptions = Evaluate<GetOrderMetadataParameters & ScopeKeyParameter>;

export function getOrderMetadataQueryOptions(
    config: Config | undefined,
    options: GetOrderMetadataOptions,
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getOrderMetadata");
            const orderMetadata = await getOrderMetadata(config, parameters);
            return orderMetadata ?? null;
        },
        queryKey: getOrderMetadataQueryKey({
            scopeKey: config?.state.id,
            ...options,
        }),
    } as const satisfies QueryOptions<
        GetOrderMetadataQueryFnData,
        GetOrderMetadataErrorType,
        GetOrderMetadataData,
        GetOrderMetadataQueryKey
    >;
}

export type GetOrderMetadataQueryFnData = Evaluate<GetOrderMetadataReturnType>;

export type GetOrderMetadataData = GetOrderMetadataQueryFnData;

export function getOrderMetadataQueryKey(options: GetOrderMetadataOptions) {
    return ["order-metadata", filterQueryOptions(options)] as const;
}

export type GetOrderMetadataQueryKey = ReturnType<typeof getOrderMetadataQueryKey>;
