import type { MutationOptions } from '@tanstack/query-core'

import {
  type DepositRequestErrorType,
  type DepositRequestParameters,
  type DepositRequestReturnType,
  depositRequest,
} from '../actions/depositRequest.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import type { Mutate, MutateAsync } from './types.js'

export function depositRequestMutationOptions(config: Config) {
  return {
    mutationFn(variables) {
      return depositRequest(config, variables)
    },
    mutationKey: ['depositRequest'],
  } as const satisfies MutationOptions<
    DepositRequestData,
    DepositRequestErrorType,
    DepositRequestVariables
  >
}

export type DepositRequestData = DepositRequestReturnType

export type DepositRequestVariables = Evaluate<DepositRequestParameters>

export type DepositRequestMutate<context = unknown> = Mutate<
  DepositRequestData,
  DepositRequestErrorType,
  DepositRequestVariables,
  context
>

export type DepositRequestMutateAsync<context = unknown> = MutateAsync<
  DepositRequestData,
  DepositRequestErrorType,
  DepositRequestVariables,
  context
>
