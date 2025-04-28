import type { MutationOptions } from "@tanstack/query-core";

import {
    type WithdrawRequestErrorType,
    type WithdrawRequestParameters,
    type WithdrawRequestReturnType,
    withdrawRequest,
} from "../actions/withdrawRequest.js";
import type { Config } from "../createConfig.js";
import type { Evaluate } from "../types/utils.js";
import type { Mutate, MutateAsync } from "./types.js";

export function withdrawRequestMutationOptions(config: Config) {
    return {
        mutationFn(variables) {
            return withdrawRequest(config, variables);
        },
        mutationKey: ["withdrawRequest"],
    } as const satisfies MutationOptions<
        WithdrawRequestData,
        WithdrawRequestErrorType,
        WithdrawRequestVariables
    >;
}

export type WithdrawRequestData = WithdrawRequestReturnType;

export type WithdrawRequestVariables = Evaluate<WithdrawRequestParameters>;

export type WithdrawRequestMutate<context = unknown> = Mutate<
    WithdrawRequestData,
    WithdrawRequestErrorType,
    WithdrawRequestVariables,
    context
>;

export type WithdrawRequestMutateAsync<context = unknown> = MutateAsync<
    WithdrawRequestData,
    WithdrawRequestErrorType,
    WithdrawRequestVariables,
    context
>;
