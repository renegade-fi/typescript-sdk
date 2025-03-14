'use client'

import {
  type Config,
  WALLET_ROUTE,
  type Wallet,
  getSymmetricKey,
  parseBigJSON,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket.js'
import { createSignedWebSocketRequest } from '../utils/websocket.js'
import { useWasmInitialized } from '../wasm.js'
import { useConfig } from './useConfig.js'
import { useStatus } from './useStatus.js'
import { useWalletId } from './useWalletId.js'

export type UseWalletParameters = {
  config?: Config
  onUpdate?: (wallet: Wallet) => void
  enabled?: boolean
}

export function useWalletWebsocket(parameters: UseWalletParameters = {}) {
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
    // Capture the current (old) wallet id in a local variable
    const currentWalletId = walletId

    if (
      !enabled ||
      !currentWalletId ||
      readyState !== ReadyState.OPEN ||
      status !== 'in relayer' ||
      !isWasmInitialized
    )
      return

    // Subscribe to wallet updates
    const body = {
      method: 'subscribe',
      topic: WALLET_ROUTE(currentWalletId),
    } as const

    const symmetricKey = getSymmetricKey(config)
    const subscriptionMessage = createSignedWebSocketRequest(
      config,
      symmetricKey,
      body,
    )
    sendJsonMessage(subscriptionMessage)

    // Cleanup: unsubscribe the OLD wallet ID
    return () => {
      // Ensure that we have a valid wallet id to unsubscribe
      if (!currentWalletId || readyState !== ReadyState.OPEN) return

      const unsubscriptionBody = {
        method: 'unsubscribe',
        topic: WALLET_ROUTE(currentWalletId),
      } as const

      const unsubscriptionMessage = createSignedWebSocketRequest(
        config,
        symmetricKey,
        unsubscriptionBody,
      )
      sendJsonMessage(unsubscriptionMessage)
    }
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
