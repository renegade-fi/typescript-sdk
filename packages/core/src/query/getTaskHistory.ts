import type { QueryOptions } from '@tanstack/query-core'
import {
  getTaskHistory,
  type GetTaskHistoryErrorType,
  type GetTaskHistoryReturnType,
} from '../actions/getTaskHistory.js'
import type { Config } from '../createConfig.js'
import type { Evaluate } from '../types/utils.js'
import { filterQueryOptions, type ScopeKeyParameter } from './utils.js'

export type GetTaskHistoryOptions = Evaluate<ScopeKeyParameter>

export function getTaskHistoryQueryOptions(
  config: Config,
  options: GetTaskHistoryOptions = {},
) {
  return {
    async queryFn({ queryKey }) {
      const { scopeKey: _ } = queryKey[1]
      const history = await getTaskHistory(config)
      return history ?? null
    },
    queryKey: getTaskHistoryQueryKey(options),
  } as const satisfies QueryOptions<
    GetTaskHistoryQueryFnData,
    GetTaskHistoryErrorType,
    GetTaskHistoryData,
    GetTaskHistoryQueryKey
  >
}

export type GetTaskHistoryQueryFnData = Evaluate<GetTaskHistoryReturnType>

export type GetTaskHistoryData = GetTaskHistoryQueryFnData

export function getTaskHistoryQueryKey(options: GetTaskHistoryOptions = {}) {
  return ['task-history', filterQueryOptions(options)] as const
}

export type GetTaskHistoryQueryKey = ReturnType<typeof getTaskHistoryQueryKey>
