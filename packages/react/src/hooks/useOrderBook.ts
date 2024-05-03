'use client'

import type { Config, NetworkOrder } from '@renegade-fi/core'
import { getNetworkOrders } from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import { useConfig } from './useConfig.js'
import { useOrderBookWebSocket } from './useOrderBookWebSocket.js'

export type UseOrderBookParameters = {
  config?: Config
}

export type UseOrderBookReturnType = NetworkOrder[]

export function useOrderBook(
  parameters: UseOrderBookParameters = {},
): UseOrderBookReturnType {
  const config = useConfig(parameters)
  const [networkOrders, setNetworkOrders] = useState<Map<string, NetworkOrder>>(
    new Map(),
  )
  const incomingOrder = useOrderBookWebSocket()

  useEffect(() => {
    async function fetchNetworkOrders() {
      const initialNetworkOrders = await getNetworkOrders(config)
      const ordersMap = new Map(
        initialNetworkOrders.map((order) => [order.id, order]),
      )
      setNetworkOrders(ordersMap)
    }

    fetchNetworkOrders()
  }, [config])

  useEffect(() => {
    if (incomingOrder) {
      setNetworkOrders((prev) =>
        new Map(prev).set(incomingOrder.id, incomingOrder),
      )
    }
  }, [incomingOrder])

  const sortedNetworkOrders = Array.from(networkOrders.values()).sort(
    (a, b) => {
      if (a.timestamp === b.timestamp) {
        return a.id.localeCompare(b.id)
      }
      return a.timestamp > b.timestamp ? -1 : 1
    },
  )

  return sortedNetworkOrders
}
