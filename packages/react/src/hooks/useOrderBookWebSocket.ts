'use client'

import {
  ORDER_BOOK_ROUTE,
  parseBigJSON,
  type Config,
  type NetworkOrder,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'

export type UseOrderBookWebSocketParameters = {
  config?: Config
  onUpdate?: (order: NetworkOrder) => void
  enabled?: boolean
}

export type UseOrderBookWebSocketReturnType = NetworkOrder | undefined

export function useOrderBookWebSocket(
  parameters: UseOrderBookWebSocketParameters = {},
) {
  const config = useConfig(parameters)
  const { getWebsocketBaseUrl } = config
  const { onUpdate, enabled } = parameters

  const { readyState, sendJsonMessage } = useWebSocket.default(
    getWebsocketBaseUrl(),
    {
      filter: () => false,
      onMessage: (event) => {
        const messageData = parseBigJSON(event.data)
        if (
          messageData.topic === ORDER_BOOK_ROUTE &&
          (messageData.event?.type === 'NewOrder' ||
            messageData.event?.type === 'OrderStateChange') &&
          messageData.event?.order
        ) {
          onUpdate?.(messageData.event.order)
        }
      },
      share: true,
      shouldReconnect: () => true,
    },
    enabled,
  )

  useEffect(() => {
    if (enabled && readyState !== ReadyState.OPEN) return

    const body = {
      method: 'subscribe',
      topic: ORDER_BOOK_ROUTE,
    }
    const message = {
      body,
      headers: {},
    }
    sendJsonMessage(message)
  }, [enabled, readyState, sendJsonMessage])
}
