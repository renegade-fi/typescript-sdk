import type { QueryOptions } from '@tanstack/query-core'
import {
  getWalletFromRelayer,
  type GetWalletFromRelayerErrorType,
  type GetWalletFromRelayerParameters,
  type GetWalletFromRelayerReturnType,
} from '../actions/getWalletFromRelayer.js'
import type { Config } from '../createConfig.js'
import type { Evaluate, PartialBy } from '../types/utils.js'
import { filterQueryOptions, type ScopeKeyParameter } from './utils.js'

export type GetWalletOptions = Evaluate<
  PartialBy<GetWalletFromRelayerParameters, 'seed'> & ScopeKeyParameter
>

export function getWalletQueryOptions(
  config: Config,
  options: GetWalletOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { seed, scopeKey: _, ...parameters } = queryKey[1]
      if (!seed) throw new Error('seed is required')
      const wallet = await getWalletFromRelayer(config, {
        ...(parameters as GetWalletFromRelayerParameters),
        seed,
      })
      return wallet ?? null
    },
    queryKey: getWalletQueryKey(options),
  } as const satisfies QueryOptions<
    GetWalletQueryFnData,
    GetWalletFromRelayerErrorType,
    GetWalletData,
    GetWalletQueryKey
  >
}

export type GetWalletQueryFnData = Evaluate<GetWalletFromRelayerReturnType>

export type GetWalletData = GetWalletQueryFnData

export function getWalletQueryKey(options: GetWalletOptions = {}) {
  return ['wallet', filterQueryOptions(options)] as const
}

export type GetWalletQueryKey = ReturnType<typeof getWalletQueryKey>
