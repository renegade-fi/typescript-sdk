"use client";

import type { CancelOrderRequestErrorType, Evaluate } from "@renegade-fi/core";
import {
    type CancelOrderRequestData,
    type CancelOrderRequestMutate,
    type CancelOrderRequestMutateAsync,
    type CancelOrderRequestVariables,
    cancelOrderRequestMutationOptions,
} from "@renegade-fi/core/query";
import { useMutation } from "@tanstack/react-query";
import type { ConfigParameter } from "../types/properties.js";
import type { UseMutationParameters, UseMutationReturnType } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseCancelOrderParameters<context = unknown> = Evaluate<
    ConfigParameter & {
        mutation?:
            | UseMutationParameters<
                  CancelOrderRequestData,
                  CancelOrderRequestErrorType,
                  CancelOrderRequestVariables,
                  context
              >
            | undefined;
    }
>;

export type UseCancelOrderReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        CancelOrderRequestData,
        CancelOrderRequestErrorType,
        CancelOrderRequestVariables,
        context
    > & {
        cancelOrder: CancelOrderRequestMutate<context>;
        cancelOrderAsync: CancelOrderRequestMutateAsync<context>;
    }
>;

export function useCancelOrder<context = unknown>(
    parameters: UseCancelOrderParameters<context> = {},
): UseCancelOrderReturnType<context> {
    const { mutation } = parameters;

    const config = useConfig(parameters);

    const mutationOptions = cancelOrderRequestMutationOptions(config);
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
    });

    return {
        ...result,
        cancelOrder: mutate,
        cancelOrderAsync: mutateAsync,
    };
}
