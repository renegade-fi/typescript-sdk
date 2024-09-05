'use client'

import type { DepositRequestErrorType } from '@renegade-fi/core'
import type { Evaluate } from '@renegade-fi/core'
import {
  type DepositRequestData,
  type DepositRequestMutate,
  type DepositRequestMutateAsync,
  type DepositRequestVariables,
  depositRequestMutationOptions,
} from '@renegade-fi/core/query'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type {
  UseMutationParameters,
  UseMutationReturnType,
} from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseDepositParameters<context = unknown> = Evaluate<
  ConfigParameter & {
    mutation?:
      | UseMutationParameters<
          DepositRequestData,
          DepositRequestErrorType,
          DepositRequestVariables,
          context
        >
      | undefined
  }
>

export type UseDepositReturnType<context = unknown> = Evaluate<
  UseMutationReturnType<
    DepositRequestData,
    DepositRequestErrorType,
    DepositRequestVariables,
    context
  > & {
    deposit: DepositRequestMutate<context>
    depositAsync: DepositRequestMutateAsync<context>
  }
>

export function useDeposit<context = unknown>(
  parameters: UseDepositParameters<context> = {},
): UseDepositReturnType<context> {
  const { mutation } = parameters

  const config = useConfig(parameters)

  const mutationOptions = depositRequestMutationOptions(config)
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  })

  return {
    ...result,
    deposit: mutate,
    depositAsync: mutateAsync,
  }
}
