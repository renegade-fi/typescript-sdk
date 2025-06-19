"use client";

import type { CreateOrderRequestErrorType, Evaluate } from "@renegade-fi/core";
import {
    type CreateOrderRequestData,
    type CreateOrderRequestMutate,
    type CreateOrderRequestMutateAsync,
    type CreateOrderRequestVariables,
    createOrderRequestMutationOptions,
} from "@renegade-fi/core/query";
import { useMutation } from "@tanstack/react-query";
import type { ConfigParameter } from "../types/properties.js";
import type { UseMutationParameters, UseMutationReturnType } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseCreateOrderParameters<context = unknown> = Evaluate<
    ConfigParameter & {
        mutation?:
            | UseMutationParameters<
                  CreateOrderRequestData,
                  CreateOrderRequestErrorType,
                  CreateOrderRequestVariables,
                  context
              >
            | undefined;
    }
>;

export type UseCreateOrderReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        CreateOrderRequestData,
        CreateOrderRequestErrorType,
        CreateOrderRequestVariables,
        context
    > & {
        createOrder: CreateOrderRequestMutate<context>;
        createOrderAsync: CreateOrderRequestMutateAsync<context>;
    }
>;

export function useCreateOrder<context = unknown>(
    parameters: UseCreateOrderParameters<context> = {},
): UseCreateOrderReturnType<context> {
    const { mutation } = parameters;

    const config = useConfig(parameters);

    const mutationOptions = createOrderRequestMutationOptions(config);
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
    });

    return {
        ...result,
        createOrder: mutate,
        createOrderAsync: mutateAsync,
    };
}
