'use client'

import type { WithdrawRequestErrorType } from '@renegade-fi/core'
import type { Evaluate } from '@renegade-fi/core'
import {
  type WithdrawRequestData,
  type WithdrawRequestMutate,
  type WithdrawRequestMutateAsync,
  type WithdrawRequestVariables,
  withdrawRequestMutationOptions,
} from '@renegade-fi/core/query'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type {
  UseMutationParameters,
  UseMutationReturnType,
} from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseWithdrawParameters<context = unknown> = Evaluate<
  ConfigParameter & {
    mutation?:
    | UseMutationParameters<
      WithdrawRequestData,
      WithdrawRequestErrorType,
      WithdrawRequestVariables,
      context
    >
    | undefined
  }
>

export type UseWithdrawReturnType<context = unknown> = Evaluate<
  UseMutationReturnType<
    WithdrawRequestData,
    WithdrawRequestErrorType,
    WithdrawRequestVariables,
    context
  > & {
    withdraw: WithdrawRequestMutate<context>
    withdrawAsync: WithdrawRequestMutateAsync<context>
  }
>

export function useWithdraw<context = unknown>(
  parameters: UseWithdrawParameters<context> = {},
): UseWithdrawReturnType<context> {
  const { mutation } = parameters

  const config = useConfig(parameters)

  const mutationOptions = withdrawRequestMutationOptions(config)
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  })

  return {
    ...result,
    withdraw: mutate,
    withdrawAsync: mutateAsync,
  }
}
