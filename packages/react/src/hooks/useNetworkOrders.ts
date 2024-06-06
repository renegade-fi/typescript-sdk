'use client'

import {
  getNetworkOrdersQueryOptions,
  type Evaluate,
  type GetNetworkOrdersData,
  type GetNetworkOrdersErrorType,
  type GetNetworkOrdersOptions,
  type GetNetworkOrdersQueryFnData,
  type GetNetworkOrdersQueryKey,
  type NetworkOrder,
} from '@renegade-fi/core'
import { useQueryClient } from '@tanstack/react-query'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import { useQuery, type UseQueryReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useOrderBookWebSocket } from './useOrderBookWebSocket.js'

export type UseNetworkOrdersParameters<selectData = GetNetworkOrdersData> =
  Evaluate<
    GetNetworkOrdersOptions &
      ConfigParameter &
      QueryParameter<
        GetNetworkOrdersQueryFnData,
        GetNetworkOrdersErrorType,
        selectData,
        GetNetworkOrdersQueryKey
      >
  >

export type UseNetworkOrdersReturnType<selectData = GetNetworkOrdersData> =
  UseQueryReturnType<selectData, GetNetworkOrdersErrorType>

export function useNetworkOrders<selectData = GetNetworkOrdersData>(
  parameters: UseNetworkOrdersParameters<selectData> = {},
): UseNetworkOrdersReturnType<selectData> {
  const { query = {} } = parameters

  const config = useConfig(parameters)
  const queryClient = useQueryClient()

  const options = getNetworkOrdersQueryOptions(config, {
    ...parameters,
  })
  const enabled = Boolean(query.enabled ?? true)

  useOrderBookWebSocket({
    enabled,
    onUpdate: (incoming: NetworkOrder) => {
      if (queryClient && options.queryKey) {
        const existingMap =
          queryClient.getQueryData<GetNetworkOrdersData>(options.queryKey) ||
          new Map()
        const existingTask = existingMap.get(incoming.id)

        if (!existingTask || incoming.state !== existingTask.state) {
          const newMap = new Map(existingMap)
          newMap.set(incoming.id, incoming)
          queryClient.setQueryData(options.queryKey, newMap)
        }
      }
    },
  })

  // Disable refetch to prevent flickering in multinode cluster (orderbook is not part of consensus)
  return useQuery({
    ...query,
    ...options,
    enabled,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })
}
