import type { QueryOptions } from "@tanstack/query-core";
import { type GetPingErrorType, type GetPingReturnType, getPing } from "../actions/ping.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { type ScopeKeyParameter, filterQueryOptions } from "./utils.js";

export type GetPingOptions = Evaluate<ScopeKeyParameter>;

export function getPingQueryOptions(config: Config | undefined, options: GetPingOptions = {}) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _ } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getPing");
            const ping = await getPing(config);
            return ping ?? null;
        },
        queryKey: getPingQueryKey(options),
    } as const satisfies QueryOptions<
        GetPingQueryFnData,
        GetPingErrorType,
        GetPingData,
        GetPingQueryKey
    >;
}

export type GetPingQueryFnData = Evaluate<GetPingReturnType>;

export type GetPingData = GetPingQueryFnData;

export function getPingQueryKey(options: GetPingOptions = {}) {
    return ["ping", filterQueryOptions(options)] as const;
}

export type GetPingQueryKey = ReturnType<typeof getPingQueryKey>;
