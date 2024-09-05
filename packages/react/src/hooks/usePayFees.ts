'use client'

import type { PayFeesErrorType } from '@renegade-fi/core'
import type { Evaluate } from '@renegade-fi/core'
import {
  type PayFeesRequestData,
  type PayFeesRequestMutate,
  type PayFeesRequestMutateAsync,
  type PayFeesRequestVariables,
  payFeesRequestMutationOptions,
} from '@renegade-fi/core/query'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type {
  UseMutationParameters,
  UseMutationReturnType,
} from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UsePayFeesParameters<context = unknown> = Evaluate<
  ConfigParameter & {
    mutation?:
      | UseMutationParameters<
          PayFeesRequestData,
          PayFeesErrorType,
          PayFeesRequestVariables,
          context
        >
      | undefined
  }
>

export type UsePayFeesReturnType<context = unknown> = Evaluate<
  UseMutationReturnType<
    PayFeesRequestData,
    PayFeesErrorType,
    PayFeesRequestVariables,
    context
  > & {
    payFees: PayFeesRequestMutate<context>
    payFeesAsync: PayFeesRequestMutateAsync<context>
  }
>

export function usePayFees<context = unknown>(
  parameters: UsePayFeesParameters<context> = {},
): UsePayFeesReturnType<context> {
  const { mutation } = parameters

  const config = useConfig(parameters)

  const mutationOptions = payFeesRequestMutationOptions(config)
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  })

  return {
    ...result,
    payFees: mutate,
    payFeesAsync: mutateAsync,
  }
}
