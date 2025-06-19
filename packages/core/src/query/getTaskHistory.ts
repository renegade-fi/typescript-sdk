import type { QueryOptions } from "@tanstack/query-core";
import {
    type GetTaskHistoryErrorType,
    type GetTaskHistoryParameters,
    type GetTaskHistoryReturnType,
    getTaskHistory,
} from "../actions/getTaskHistory.js";
import type { Config } from "../createConfig.js";
import { ConfigRequiredError } from "../errors/base.js";
import type { Evaluate } from "../types/utils.js";
import { filterQueryOptions, type ScopeKeyParameter } from "./utils.js";

export type GetTaskHistoryOptions = Evaluate<GetTaskHistoryParameters & ScopeKeyParameter>;

export function getTaskHistoryQueryOptions(
    config: Config | undefined,
    options: GetTaskHistoryOptions = {},
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, ...parameters } = queryKey[1];
            if (!config) throw new ConfigRequiredError("getTaskHistory");
            const history = await getTaskHistory(config, parameters);
            return history ?? null;
        },
        queryKey: getTaskHistoryQueryKey({
            scopeKey: config?.state.id,
            ...options,
        }),
    } as const satisfies QueryOptions<
        GetTaskHistoryQueryFnData,
        GetTaskHistoryErrorType,
        GetTaskHistoryData,
        GetTaskHistoryQueryKey
    >;
}

export type GetTaskHistoryQueryFnData = Evaluate<GetTaskHistoryReturnType>;

export type GetTaskHistoryData = GetTaskHistoryQueryFnData;

export function getTaskHistoryQueryKey(options: GetTaskHistoryOptions = {}) {
    return ["task-history", filterQueryOptions(options)] as const;
}

export type GetTaskHistoryQueryKey = ReturnType<typeof getTaskHistoryQueryKey>;
