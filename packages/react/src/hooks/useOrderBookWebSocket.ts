'use client'

import {
  type Config,
  type NetworkOrder,
  ORDER_BOOK_ROUTE,
} from '@renegade-fi/core'
import JSONBigint from 'json-bigint'
import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'

export type UseOrderBookWebSocketParameters = {
  config?: Config
}

export type UseOrderBookWebSocketReturnType = NetworkOrder[] | undefined

export function useOrderBookWebSocket(
  parameters: UseOrderBookWebSocketParameters = {},
): UseOrderBookWebSocketReturnType {
  const config = useConfig(parameters)
  const { getWebsocketBaseUrl } = config
  const [orders, setOrders] = useState<NetworkOrder[]>([])

  const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(
    getWebsocketBaseUrl(),
    {
      share: true,
      shouldReconnect: () => true,
    },
  )

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return

    const body = {
      method: 'subscribe',
      topic: ORDER_BOOK_ROUTE,
    }
    const message = {
      body,
      headers: {},
    }
    sendJsonMessage(message)
  }, [readyState, sendJsonMessage])

  useEffect(() => {
    if (lastMessage) {
      try {
        const messageData = JSONBigint({ useNativeBigInt: true }).parse(
          lastMessage.data,
        )
        if (
          messageData.topic === ORDER_BOOK_ROUTE &&
          (messageData.event?.type === 'NewOrder' ||
            messageData.event?.type === 'OrderStateChange') &&
          messageData.event?.order
        ) {
          setOrders((prevOrders) => {
            const existingIndex = prevOrders.findIndex(
              (o) => o.id === messageData.event.order.id,
            )
            const updatedOrders = [...prevOrders]
            if (existingIndex !== -1) {
              updatedOrders[existingIndex] = messageData.event.order
            } else {
              updatedOrders.push(messageData.event.order)
            }
            return updatedOrders
          })
        }
      } catch (error) {
        console.error(
          'Error parsing data in WebSocket:',
          lastMessage.data,
          error,
        )
      }
    }
  }, [lastMessage])

  return orders
}
