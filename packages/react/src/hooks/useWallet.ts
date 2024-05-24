'use client'

import {
  getWalletQueryOptions,
  type Evaluate,
  type GetWalletData,
  type GetWalletErrorType,
  type GetWalletOptions,
  type GetWalletQueryFnData,
  type GetWalletQueryKey,
} from '@renegade-fi/core'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import { useQuery, type UseQueryReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useStatus } from './useStatus.js'
import { useQueryClient } from '@tanstack/react-query'
import { useWalletWebsocket } from './useWalletWebSocket.js'
import { useEffect } from 'react'

export type UseWalletParameters<selectData = GetWalletData> = Evaluate<
  GetWalletOptions &
    ConfigParameter &
    QueryParameter<
      GetWalletQueryFnData,
      GetWalletErrorType,
      selectData,
      GetWalletQueryKey
    >
>

export type UseWalletReturnType<selectData = GetWalletData> =
  UseQueryReturnType<selectData, GetWalletErrorType>

export function useWallet<selectData = GetWalletData>(
  parameters: UseWalletParameters<selectData> = {},
): UseWalletReturnType<selectData> {
  const { filterDefaults, seed, query = {} } = parameters

  const config = useConfig(parameters)
  const status = useStatus(parameters)

  const options = getWalletQueryOptions(config, {
    ...parameters,
    seed: seed ?? config.state.seed,
    filterDefaults,
  })
  const enabled = Boolean(
    status === 'in relayer' &&
      (seed || config.state.seed) &&
      (query.enabled ?? true),
  )

  const queryClient = useQueryClient()
  const incomingWallet = useWalletWebsocket({ enabled })

  useEffect(() => {
    if (incomingWallet) {
      console.log('🚀 ~ useEffect ~ incomingWallet:', incomingWallet)
      queryClient.setQueryData(options.queryKey, incomingWallet)
    }
  }, [incomingWallet])

  return useQuery({ ...query, ...options, enabled })
}
