'use client'

import {
  type Config,
  SIG_EXPIRATION_BUFFER_MS,
  WALLET_ROUTE,
  type Wallet,
  addExpiringAuthToHeaders,
  getSymmetricKey,
  parseBigJSON,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'
import { useInitialized } from './useInitialized.js'
import { useStatus } from './useStatus.js'
import { useWalletId } from './useWalletId.js'

export type UseWalletParameters = {
  config?: Config
  onUpdate?: (wallet: Wallet) => void
  enabled?: boolean
}

export function useWalletWebsocket(parameters: UseWalletParameters = {}) {
  const config = useConfig(parameters)
  const initialized = useInitialized()
  const status = useStatus(parameters)
  const walletId = useWalletId()
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
            walletId &&
            messageData.topic === WALLET_ROUTE(walletId) &&
            messageData.event?.type === 'WalletUpdate' &&
            messageData.event?.wallet
          )
            onUpdate?.(messageData.event.wallet)
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
      !initialized
    )
      return

    const body = {
      method: 'subscribe',
      topic: WALLET_ROUTE(walletId),
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
    readyState,
    walletId,
    status,
    sendJsonMessage,
    config,
    enabled,
    initialized,
  ])
}
