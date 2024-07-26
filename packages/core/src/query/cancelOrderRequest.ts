import type { MutationOptions } from '@tanstack/query-core'

import {
  type CancelOrderRequestErrorType,
  type CancelOrderRequestParameters,
  type CancelOrderRequestReturnType,
  cancelOrderRequest,
} from '../actions/cancelOrderRequest.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import type { Mutate, MutateAsync } from './types.js'

export function cancelOrderRequestMutationOptions(config: Config) {
  return {
    mutationFn(variables) {
      return cancelOrderRequest(config, variables)
    },
    mutationKey: ['cancelOrderRequest'],
  } as const satisfies MutationOptions<
    CancelOrderRequestData,
    CancelOrderRequestErrorType,
    CancelOrderRequestVariables
  >
}

export type CancelOrderRequestData = CancelOrderRequestReturnType

export type CancelOrderRequestVariables = Evaluate<CancelOrderRequestParameters>

export type CancelOrderRequestMutate<context = unknown> = Mutate<
  CancelOrderRequestData,
  CancelOrderRequestErrorType,
  CancelOrderRequestVariables,
  context
>

export type CancelOrderRequestMutateAsync<context = unknown> = MutateAsync<
  CancelOrderRequestData,
  CancelOrderRequestErrorType,
  CancelOrderRequestVariables,
  context
>
