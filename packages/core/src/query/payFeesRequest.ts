import type { MutationOptions } from "@tanstack/query-core";

import { type PayFeesErrorType, type PayFeesReturnType, payFees } from "../actions/payFees.js";
import type { Config } from "../createConfig.js";
import type { Evaluate } from "../types/utils.js";
import type { Mutate, MutateAsync } from "./types.js";

export function payFeesRequestMutationOptions(config: Config) {
    return {
        mutationFn() {
            return payFees(config);
        },
        mutationKey: ["payFeesRequest"],
    } as const satisfies MutationOptions<PayFeesReturnType, PayFeesErrorType, void>;
}

export type PayFeesRequestData = PayFeesReturnType;

export type PayFeesRequestVariables = Evaluate<void>;

export type PayFeesRequestMutate<context = unknown> = Mutate<
    PayFeesRequestData,
    PayFeesErrorType,
    PayFeesRequestVariables,
    context
>;

export type PayFeesRequestMutateAsync<context = unknown> = MutateAsync<
    PayFeesRequestData,
    PayFeesErrorType,
    PayFeesRequestVariables,
    context
>;
