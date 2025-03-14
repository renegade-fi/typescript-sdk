'use client'

import {
  type Config,
  type OrderMetadata,
  SIG_EXPIRATION_BUFFER_MS,
  WS_WALLET_ORDERS_ROUTE,
  addExpiringAuthToHeaders,
  getSymmetricKey,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket.js'
import { useWasmInitialized } from '../wasm.js'
import { useConfig } from './useConfig.js'
import { useStatus } from './useStatus.js'
import { useWalletId } from './useWalletId.js'

export type UseOrderHistoryWebSocketParameters = {
  config?: Config
  onUpdate?: (order: OrderMetadata) => void
  enabled?: boolean
}

export function useOrderHistoryWebSocket(
  parameters: UseOrderHistoryWebSocketParameters = {},
) {
  const isWasmInitialized = useWasmInitialized()
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const walletId = useWalletId()
  const { getWebsocketBaseUrl } = config
  const { enabled = true, onUpdate } = parameters

  const { readyState, sendJsonMessage } = useWebSocket(
    getWebsocketBaseUrl(),
    {
      filter: () => false,
      onMessage(event) {
        try {
          const messageData = JSON.parse(event.data, (key, value) => {
            if (typeof value === 'number' && key !== 'price') {
              return BigInt(value)
            }
            return value
          })
          if (
            walletId &&
            messageData.topic === WS_WALLET_ORDERS_ROUTE(walletId) &&
            messageData.event?.type === 'OrderMetadataUpdated' &&
            messageData.event?.order
          )
            onUpdate?.(messageData.event.order)
        } catch (_) {}
      },
      share: true,
      shouldReconnect: () => true,
    },
    enabled,
  )

  // Subscribe to wallet updates with auth headers
  useEffect(() => {
    if (
      !enabled ||
      !walletId ||
      readyState !== ReadyState.OPEN ||
      status !== 'in relayer' ||
      !isWasmInitialized
    )
      return

    const body = {
      method: 'subscribe',
      topic: WS_WALLET_ORDERS_ROUTE(walletId),
    }
    const symmetricKey = getSymmetricKey(config)
    const headers = addExpiringAuthToHeaders(
      config,
      body.topic,
      {},
      JSON.stringify(body),
      symmetricKey,
      SIG_EXPIRATION_BUFFER_MS,
    )
    const message = {
      headers,
      body,
    }
    sendJsonMessage(message)
  }, [
    enabled,
    walletId,
    readyState,
    status,
    isWasmInitialized,
    sendJsonMessage,
    config,
  ])
}
