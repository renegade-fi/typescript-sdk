import {
  getOpenOrdersQueryOptions,
  type GetOpenOrdersData,
  type GetOpenOrdersOptions,
  type GetOpenOrdersQueryFnData,
  type GetOpenOrdersQueryKey,
} from '@renegade-fi/core/query'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import type { Evaluate } from '@renegade-fi/core'
import type { GetOpenOrdersErrorType } from '@renegade-fi/core/actions'
import { useQuery, type UseQueryReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseOpenOrdersParameters<selectData = GetOpenOrdersData> = Evaluate<
  GetOpenOrdersOptions &
    ConfigParameter &
    QueryParameter<
      GetOpenOrdersQueryFnData,
      GetOpenOrdersErrorType,
      selectData,
      GetOpenOrdersQueryKey
    >
>

export type UseOpenOrdersReturnType<selectData = GetOpenOrdersData> =
  UseQueryReturnType<selectData, GetOpenOrdersErrorType>

export function useOpenOrders<selectData = GetOpenOrdersData>(
  parameters: UseOpenOrdersParameters<selectData> = {},
): UseOpenOrdersReturnType<selectData> {
  const { query = {} } = parameters

  const config = useConfig(parameters)

  const options = getOpenOrdersQueryOptions(config, {
    ...parameters,
  })
  const enabled = Boolean(query.enabled ?? true)

  return useQuery({
    ...query,
    ...options,
    enabled,
  })
}
