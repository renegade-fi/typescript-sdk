import type { QueryOptions } from '@tanstack/query-core'
import {
  getOpenOrders,
  type GetOpenOrdersErrorType,
  type GetOpenOrdersReturnType,
} from '../actions/getOpenOrders.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import { filterQueryOptions, type ScopeKeyParameter } from './utils.js'

export type GetOpenOrdersOptions = Evaluate<ScopeKeyParameter>

export function getOpenOrdersQueryOptions(
  config: Config,
  options: GetOpenOrdersOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { scopeKey: _ } = queryKey[1]
      const orders = await getOpenOrders(config)
      return orders ?? null
    },
    queryKey: getOpenOrdersQueryKey(options),
  } as const satisfies QueryOptions<
    GetOpenOrdersQueryFnData,
    GetOpenOrdersErrorType,
    GetOpenOrdersData,
    GetOpenOrdersQueryKey
  >
}

export type GetOpenOrdersQueryFnData = Evaluate<GetOpenOrdersReturnType>

export type GetOpenOrdersData = GetOpenOrdersQueryFnData

export function getOpenOrdersQueryKey(options: GetOpenOrdersOptions = {}) {
  return ['open-orders', filterQueryOptions(options)] as const
}

export type GetOpenOrdersQueryKey = ReturnType<typeof getOpenOrdersQueryKey>
