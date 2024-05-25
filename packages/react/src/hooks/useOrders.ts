'use client'

import type { Config, Order } from '@renegade-fi/core'
import { useWallet } from './useWallet.js'

export type UseOrdersParameters = {
  config?: Config
  filter?: boolean
}

export type UseOrdersReturnType = Order[]

export function useOrders(
  parameters: UseOrdersParameters = {},
): UseOrdersReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useWallet()
  if (!wallet) return []
  if (filter) {
    return wallet.orders.filter((order) => order.amount > 0)
  }
  return wallet.orders
}
