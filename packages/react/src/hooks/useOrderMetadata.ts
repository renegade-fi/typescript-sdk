import type { Evaluate } from '@renegade-fi/core'
import type { GetOrderMetadataErrorType } from '@renegade-fi/core/actions'
import {
  type GetOrderMetadataData,
  type GetOrderMetadataOptions,
  type GetOrderMetadataQueryFnData,
  type GetOrderMetadataQueryKey,
  getOrderMetadataQueryOptions,
} from '@renegade-fi/core/query'
import type { ConfigParameter, QueryParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseOrderMetadataParameters<selectData = GetOrderMetadataData> =
  Evaluate<
    GetOrderMetadataOptions &
      ConfigParameter &
      QueryParameter<
        GetOrderMetadataQueryFnData,
        GetOrderMetadataErrorType,
        selectData,
        GetOrderMetadataQueryKey
      >
  >

export type UseOrderMetadataReturnType<selectData = GetOrderMetadataData> =
  UseQueryReturnType<selectData, GetOrderMetadataErrorType>

export function useOrderMetadata<selectData = GetOrderMetadataData>(
  parameters: UseOrderMetadataParameters<selectData>,
): UseOrderMetadataReturnType<selectData> {
  const { query } = parameters

  const config = useConfig(parameters)

  const options = getOrderMetadataQueryOptions(config, {
    ...parameters,
  })
  const enabled = Boolean(query?.enabled ?? true)

  return useQuery({
    ...query,
    ...options,
    enabled,
  })
}
