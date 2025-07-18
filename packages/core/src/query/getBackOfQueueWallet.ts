import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetBackOfQueueWalletErrorType,
    type GetBackOfQueueWalletParameters,
    type GetBackOfQueueWalletReturnType,
    getBackOfQueueWallet,
} from "../actions/getBackOfQueueWallet.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetBackOfQueueWalletOptions = Evaluate<GetBackOfQueueWalletParameters> &
    ScopeKeyParameter;

export function getBackOfQueueWalletQueryOptions(
    config: Config | undefined,
    options: GetBackOfQueueWalletOptions = {},
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getBackOfQueueWallet");
            const wallet = await getBackOfQueueWallet(config, {
                ...(parameters as GetBackOfQueueWalletParameters),
            });
            return wallet ?? null;
        },
        queryKey: getBackOfQueueWalletQueryKey({
            scopeKey: config?.state.id,
            ...options,
        }),
    } as const satisfies QueryOptions<
        GetBackOfQueueWalletQueryFnData,
        GetBackOfQueueWalletErrorType,
        GetBackOfQueueWalletData,
        GetBackOfQueueWalletQueryKey
    >;
}

export type GetBackOfQueueWalletQueryFnData = Evaluate<GetBackOfQueueWalletReturnType>;

export type GetBackOfQueueWalletData = GetBackOfQueueWalletQueryFnData;

export function getBackOfQueueWalletQueryKey(options: GetBackOfQueueWalletOptions = {}) {
    return ["backOfQueueWallet", filterQueryOptions(options)] as const;
}

export type GetBackOfQueueWalletQueryKey = ReturnType<typeof getBackOfQueueWalletQueryKey>;
