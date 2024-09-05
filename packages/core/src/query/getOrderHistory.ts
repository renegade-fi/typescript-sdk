import type { QueryOptions } from '@tanstack/query-core'
import {
  type GetOrderHistoryErrorType,
  type GetOrderHistoryReturnType,
  getOrderHistory,
} from '../actions/getOrderHistory.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import { type ScopeKeyParameter, filterQueryOptions } from './utils.js'

export type GetOrderHistoryOptions = Evaluate<ScopeKeyParameter>

export function getOrderHistoryQueryOptions(
  config: Config,
  options: GetOrderHistoryOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { scopeKey: _ } = queryKey[1]
      const history = await getOrderHistory(config)
      return history ?? null
    },
    queryKey: getOrderHistoryQueryKey({
      scopeKey: config.state.id,
      ...options,
    }),
  } as const satisfies QueryOptions<
    GetOrderHistoryQueryFnData,
    GetOrderHistoryErrorType,
    GetOrderHistoryData,
    GetOrderHistoryQueryKey
  >
}

export type GetOrderHistoryQueryFnData = Evaluate<GetOrderHistoryReturnType>

export type GetOrderHistoryData = GetOrderHistoryQueryFnData

export function getOrderHistoryQueryKey(options: GetOrderHistoryOptions = {}) {
  return ['order-history', filterQueryOptions(options)] as const
}

export type GetOrderHistoryQueryKey = ReturnType<typeof getOrderHistoryQueryKey>
