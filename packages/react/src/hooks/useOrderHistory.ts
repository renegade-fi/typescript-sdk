'use client'

import type { Config, OrderMetadata } from '@renegade-fi/core'
import { getOrderHistory } from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import { useConfig } from './useConfig.js'
import { useOrderHistoryWebSocket } from './useOrderHistoryWebSocket.js'
import { useStatus } from './useStatus.js'

export type UseOrderHistoryParameters = {
  config?: Config
  sort?: 'asc' | 'desc'
}

export type UseOrderHistoryReturnType = OrderMetadata[]

export function useOrderHistory(
  parameters: UseOrderHistoryParameters = {},
): UseOrderHistoryReturnType {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const { sort } = parameters
  const [orderHistory, setOrderHistory] = useState<Map<string, OrderMetadata>>(
    new Map(),
  )
  const incomingOrder = useOrderHistoryWebSocket()

  useEffect(() => {
    if (status !== 'in relayer') {
      setOrderHistory(new Map())
      return
    }

    async function fetchOrderHistory() {
      const initialOrderHistory = await getOrderHistory(config)
      const orderMap = new Map(
        initialOrderHistory.map((order) => [order.id, order]),
      )
      setOrderHistory(orderMap)
    }

    fetchOrderHistory()
  }, [status, config])

  useEffect(() => {
    if (incomingOrder) {
      setOrderHistory((prev) =>
        new Map(prev).set(incomingOrder.id, incomingOrder),
      )
    }
  }, [incomingOrder])

  const sortedOrderHistory = Array.from(orderHistory.values())
  if (sort) {
    sortedOrderHistory.sort((a, b) => {
      if (sort === 'asc') {
        return Number(a.created) - Number(b.created)
      }
      return Number(b.created) - Number(a.created)
    })
  }

  return sortedOrderHistory
}
