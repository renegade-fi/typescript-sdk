import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetWalletFromRelayerErrorType,
    type GetWalletFromRelayerParameters,
    type GetWalletFromRelayerReturnType,
    getWalletFromRelayer,
} from "../actions/getWalletFromRelayer.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetWalletOptions = Evaluate<GetWalletFromRelayerParameters & ScopeKeyParameter>;

export function getWalletQueryOptions(config: Config | undefined, options: GetWalletOptions = {}) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getWallet");
            const wallet = await getWalletFromRelayer(config, {
                ...(parameters as GetWalletFromRelayerParameters),
            });
            return wallet ?? null;
        },
        queryKey: getWalletQueryKey({ scopeKey: config?.state.id, ...options }),
    } as const satisfies QueryOptions<
        GetWalletQueryFnData,
        GetWalletFromRelayerErrorType,
        GetWalletData,
        GetWalletQueryKey
    >;
}

export type GetWalletQueryFnData = Evaluate<GetWalletFromRelayerReturnType>;

export type GetWalletData = GetWalletQueryFnData;

export function getWalletQueryKey(options: GetWalletOptions = {}) {
    return ["wallet", filterQueryOptions(options)] as const;
}

export type GetWalletQueryKey = ReturnType<typeof getWalletQueryKey>;
