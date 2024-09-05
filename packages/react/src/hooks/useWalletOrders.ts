'use client'

import type { Config, Order } from '@renegade-fi/core'
import { useWallet } from './useWallet.js'

export type UseOrdersParameters = {
  config?: Config
  filterDefaults?: boolean
}

export type UseOrdersReturnType = Order[]

export function useOrders(
  parameters: UseOrdersParameters = {},
): UseOrdersReturnType {
  const { filterDefaults = true } = parameters
  const { data } = useWallet({ filterDefaults })
  if (!data) return []
  return data.orders
}
