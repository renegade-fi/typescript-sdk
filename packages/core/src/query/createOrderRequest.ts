import type { MutationOptions } from "@tanstack/query-core";

import {
    type CreateOrderRequestErrorType,
    type CreateOrderRequestParameters,
    type CreateOrderRequestReturnType,
    createOrderRequest,
} from "../actions/createOrderRequest.js";
import type { Config } from "../createConfig.js";
import type { Evaluate } from "../types/utils.js";
import type { Mutate, MutateAsync } from "./types.js";

export function createOrderRequestMutationOptions(config: Config) {
    return {
        mutationFn(variables) {
            return createOrderRequest(config, variables);
        },
        mutationKey: ["createOrderRequest"],
    } as const satisfies MutationOptions<
        CreateOrderRequestData,
        CreateOrderRequestErrorType,
        CreateOrderRequestVariables
    >;
}

export type CreateOrderRequestData = CreateOrderRequestReturnType;

export type CreateOrderRequestVariables = Evaluate<CreateOrderRequestParameters>;

export type CreateOrderRequestMutate<context = unknown> = Mutate<
    CreateOrderRequestData,
    CreateOrderRequestErrorType,
    CreateOrderRequestVariables,
    context
>;

export type CreateOrderRequestMutateAsync<context = unknown> = MutateAsync<
    CreateOrderRequestData,
    CreateOrderRequestErrorType,
    CreateOrderRequestVariables,
    context
>;
