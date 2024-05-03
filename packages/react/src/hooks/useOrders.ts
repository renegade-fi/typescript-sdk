'use client'

import type { Config, Order } from '@renegade-fi/core'
import { getOrders } from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import { useConfig } from './useConfig.js'
import { useWallet } from './useWalletWebSocket.js'
import { useStatus } from './useStatus.js'

export type UseOrdersParameters = {
  config?: Config
  filter?: boolean
}

export type UseOrdersReturnType = Order[]

export function useOrders(
  parameters: UseOrdersParameters = {},
): UseOrdersReturnType {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const { filter = true } = parameters
  const [orders, setOrders] = useState<Order[]>([])
  const wallet = useWallet()

  useEffect(() => {
    if (status !== 'in relayer') {
      setOrders([])
      return
    }

    async function fetchOrders() {
      const initialOrders = await getOrders(config)
      setOrders(initialOrders)
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)

    return () => clearInterval(interval)
  }, [status, config])

  useEffect(() => {
    if (wallet?.orders) {
      setOrders(wallet.orders)
    }
  }, [wallet])

  if (filter) {
    return orders.filter((order) => order.amount > 0)
  }

  return orders
}
