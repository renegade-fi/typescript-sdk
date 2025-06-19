"use client";

import type { ConnectErrorType, Evaluate } from "@renegade-fi/core";
import {
    type ConnectData,
    type ConnectMutate,
    type ConnectMutateAsync,
    type ConnectVariables,
    connectMutationOptions,
} from "@renegade-fi/core/query";
import { useMutation } from "@tanstack/react-query";
import type { ConfigParameter } from "../types/properties.js";
import type { UseMutationParameters, UseMutationReturnType } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseConnectParameters<context = unknown> = Evaluate<
    ConfigParameter & {
        mutation?:
            | UseMutationParameters<ConnectData, ConnectErrorType, ConnectVariables, context>
            | undefined;
    }
>;

export type UseConnectReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<ConnectData, ConnectErrorType, ConnectVariables, context> & {
        connect: ConnectMutate<context>;
        connectAsync: ConnectMutateAsync<context>;
    }
>;

export function useConnect<context = unknown>(
    parameters: UseConnectParameters<context> = {},
): UseConnectReturnType<context> {
    const { mutation } = parameters;

    const config = useConfig(parameters);

    const mutationOptions = connectMutationOptions(config);
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
    });

    return {
        ...result,
        connect: mutate,
        connectAsync: mutateAsync,
    };
}
