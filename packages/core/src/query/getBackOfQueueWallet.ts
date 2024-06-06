import type { QueryOptions } from '@tanstack/query-core'
import {
  getBackOfQueueWallet,
  type GetBackOfQueueWalletErrorType,
  type GetBackOfQueueWalletParameters,
  type GetBackOfQueueWalletReturnType,
} from '../actions/getBackOfQueueWallet.js'
import type { Config } from '../createConfig.js'
import type { Evaluate, PartialBy } from '../types/utils.js'
import { filterQueryOptions, type ScopeKeyParameter } from './utils.js'

export type GetBackOfQueueWalletOptions = Evaluate<
  PartialBy<GetBackOfQueueWalletParameters, 'seed'> & ScopeKeyParameter
>

export function getBackOfQueueWalletQueryOptions(
  config: Config,
  options: GetBackOfQueueWalletOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { seed, scopeKey: _, ...parameters } = queryKey[1]
      if (!seed) throw new Error('seed is required')
      const wallet = await getBackOfQueueWallet(config, {
        ...(parameters as GetBackOfQueueWalletParameters),
        seed,
      })
      return wallet ?? null
    },
    queryKey: getBackOfQueueWalletQueryKey(options),
  } as const satisfies QueryOptions<
    GetBackOfQueueWalletQueryFnData,
    GetBackOfQueueWalletErrorType,
    GetBackOfQueueWalletData,
    GetBackOfQueueWalletQueryKey
  >
}

export type GetBackOfQueueWalletQueryFnData =
  Evaluate<GetBackOfQueueWalletReturnType>

export type GetBackOfQueueWalletData = GetBackOfQueueWalletQueryFnData

export function getBackOfQueueWalletQueryKey(
  options: GetBackOfQueueWalletOptions = {},
) {
  return ['backOfQueueWallet', filterQueryOptions(options)] as const
}

export type GetBackOfQueueWalletQueryKey = ReturnType<
  typeof getBackOfQueueWalletQueryKey
>
