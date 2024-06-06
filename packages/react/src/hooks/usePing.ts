'use client'

import type { Evaluate } from '@renegade-fi/core'
import type { GetPingErrorType } from '@renegade-fi/core/actions'
import {
  getPingQueryOptions,
  type GetPingData,
  type GetPingOptions,
  type GetPingQueryFnData,
  type GetPingQueryKey,
} from '@renegade-fi/core/query'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import { useQuery, type UseQueryReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UsePingParameters<selectData = GetPingData> = Evaluate<
  GetPingOptions &
    ConfigParameter &
    QueryParameter<
      GetPingQueryFnData,
      GetPingErrorType,
      selectData,
      GetPingQueryKey
    >
>

export type UsePingReturnType<selectData = GetPingData> = UseQueryReturnType<
  selectData,
  GetPingErrorType
>

export function usePing<selectData = GetPingData>(
  parameters: UsePingParameters<selectData> = {},
): UsePingReturnType<selectData> {
  const { query = {} } = parameters

  const config = useConfig(parameters)
  const options = getPingQueryOptions(config)
  const enabled = Boolean(query.enabled ?? true)

  return useQuery({ ...query, ...options, enabled })
}
