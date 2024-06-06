'use client'

import type { Config, Order } from '@renegade-fi/core'
import { useBackOfQueueWallet } from './useBackOfQueueWallet.js'

export type UseBackOfQueueOrdersParameters = {
  config?: Config
  filter?: boolean
}

export type UseBackOfQueueOrdersReturnType = Order[]

export function useBackOfQueueOrders(
  parameters: UseBackOfQueueOrdersParameters = {},
): UseBackOfQueueOrdersReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useBackOfQueueWallet()
  if (!wallet) return []
  if (filter) {
    return wallet.orders.filter((order) => order.amount > 0)
  }
  return wallet.orders
}
