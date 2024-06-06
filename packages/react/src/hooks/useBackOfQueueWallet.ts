'use client'

import {
  getBackOfQueueWalletQueryOptions,
  type Evaluate,
  type GetBackOfQueueWalletData,
  type GetBackOfQueueWalletOptions,
  type GetBackOfQueueWalletQueryFnData,
  type GetBackOfQueueWalletQueryKey,
} from '@renegade-fi/core'
import { useQueryClient } from '@tanstack/react-query'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import { useQuery, type UseQueryReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useStatus } from './useStatus.js'
import { useWalletWebsocket } from './useWalletWebSocket.js'
import type { GetBackOfQueueWalletErrorType } from '@renegade-fi/core/dist/types/actions/getBackOfQueueWallet.js'

export type UseBackOfQueueWalletParameters<
  selectData = GetBackOfQueueWalletData,
> = Evaluate<
  GetBackOfQueueWalletOptions &
    ConfigParameter &
    QueryParameter<
      GetBackOfQueueWalletQueryFnData,
      GetBackOfQueueWalletErrorType,
      selectData,
      GetBackOfQueueWalletQueryKey
    >
>

export type UseBackOfQueueWalletReturnType<
  selectData = GetBackOfQueueWalletData,
> = UseQueryReturnType<selectData, GetBackOfQueueWalletErrorType>

export function useBackOfQueueWallet<selectData = GetBackOfQueueWalletData>(
  parameters: UseBackOfQueueWalletParameters<selectData> = {},
): UseBackOfQueueWalletReturnType<selectData> {
  const { filterDefaults, seed, query = {} } = parameters

  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const queryClient = useQueryClient()

  const options = getBackOfQueueWalletQueryOptions(config, {
    ...parameters,
    seed: seed ?? config.state.seed,
    filterDefaults,
  })
  const enabled = Boolean(
    status === 'in relayer' &&
      (seed || config.state.seed) &&
      (query.enabled ?? true),
  )

  useWalletWebsocket({
    enabled,
    onUpdate: (wallet) => {
      if (wallet && queryClient && options.queryKey) {
        queryClient.setQueryData(options.queryKey, wallet)
      }
    },
  })

  return useQuery({ ...query, ...options, enabled })
}
