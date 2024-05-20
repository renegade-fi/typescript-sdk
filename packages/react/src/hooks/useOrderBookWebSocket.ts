'use client'

import {
  type Config,
  type NetworkOrder,
  ORDER_BOOK_ROUTE,
  parseBigJSON,
} from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'

export type UseOrderBookWebSocketParameters = {
  config?: Config
}

export type UseOrderBookWebSocketReturnType = NetworkOrder | undefined

export function useOrderBookWebSocket(
  parameters: UseOrderBookWebSocketParameters = {},
): UseOrderBookWebSocketReturnType {
  const config = useConfig(parameters)
  const { getWebsocketBaseUrl } = config
  const [order, setOrder] = useState<NetworkOrder>()

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
        const messageData = parseBigJSON(lastMessage.data)
        if (
          messageData.topic === ORDER_BOOK_ROUTE &&
          (messageData.event?.type === 'NewOrder' ||
            messageData.event?.type === 'OrderStateChange') &&
          messageData.event?.order
        ) {
          setOrder(messageData.event.order)
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

  return order
}
