import type { QueryOptions } from '@tanstack/query-core'
import {
  getPing,
  type GetPingErrorType,
  type GetPingReturnType,
} from '../actions/ping.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import { filterQueryOptions, type ScopeKeyParameter } from './utils.js'

export type GetPingOptions = Evaluate<ScopeKeyParameter>

export function getPingQueryOptions(
  config: Config,
  options: GetPingOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { scopeKey: _ } = queryKey[1]
      const ping = await getPing(config)
      return ping ?? null
    },
    queryKey: getPingQueryKey(options),
  } as const satisfies QueryOptions<
    GetPingQueryFnData,
    GetPingErrorType,
    GetPingData,
    GetPingQueryKey
  >
}

export type GetPingQueryFnData = Evaluate<GetPingReturnType>

export type GetPingData = GetPingQueryFnData

export function getPingQueryKey(options: GetPingOptions = {}) {
  return ['ping', filterQueryOptions(options)] as const
}

export type GetPingQueryKey = ReturnType<typeof getPingQueryKey>
