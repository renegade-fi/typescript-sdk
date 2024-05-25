'use client'

import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
  WS_WALLET_ORDERS_ROUTE,
  parseBigJSON,
  type Config,
  type OrderMetadata,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'

import { getSkRoot, useStatus, useWalletId } from '../index.js'

export type UseOrderHistoryWebSocketParameters = {
  config?: Config
  onUpdate?: (order: OrderMetadata) => void
  enabled?: boolean
}

export function useOrderHistoryWebSocket(
  parameters: UseOrderHistoryWebSocketParameters = {},
) {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const walletId = useWalletId()
  const { getWebsocketBaseUrl } = config
  const { enabled, onUpdate } = parameters

  const { readyState, sendJsonMessage } = useWebSocket.default(
    getWebsocketBaseUrl(),
    {
      filter: () => false,
      onMessage(event) {
        const messageData = parseBigJSON(event.data)
        if (
          walletId &&
          messageData.topic === WS_WALLET_ORDERS_ROUTE(walletId) &&
          messageData.event?.type === 'OrderMetadataUpdated' &&
          messageData.event?.order
        )
          onUpdate?.(messageData.event.order)
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
      readyState !== ReadyState.OPEN ||
      !walletId ||
      status !== 'in relayer'
    )
      return

    const body = {
      method: 'subscribe',
      topic: WS_WALLET_ORDERS_ROUTE(walletId),
    }
    const skRoot = getSkRoot(config)
    const [auth, expiration] = config.utils.build_auth_headers(
      skRoot,
      JSON.stringify(body),
      BigInt(Date.now()),
    )
    const message = {
      headers: {
        [RENEGADE_AUTH_HEADER_NAME]: auth,
        [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
      },
      body,
    }
    sendJsonMessage(message)
  }, [enabled, readyState, walletId, status, sendJsonMessage, config])
}
