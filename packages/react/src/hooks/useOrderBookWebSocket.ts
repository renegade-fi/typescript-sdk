'use client'

import {
  type Config,
  type NetworkOrder,
  ORDER_BOOK_ROUTE,
  parseBigJSON,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket.js'
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
  const { enabled = true, onUpdate } = parameters

  const { readyState, sendJsonMessage } = useWebSocket(
    getWebsocketBaseUrl(),
    {
      filter: () => false,
      onMessage: (event) => {
        try {
          const messageData = parseBigJSON(event.data)
          if (
            messageData.topic === ORDER_BOOK_ROUTE &&
            (messageData.event?.type === 'NewOrder' ||
              messageData.event?.type === 'OrderStateChange') &&
            messageData.event?.order
          ) {
            onUpdate?.(messageData.event.order)
          }
        } catch (_) {}
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
