'use client'

import {
  type Config,
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
  WALLET_ROUTE,
  type Wallet,
  getSymmetricKey,
  parseBigJSON
} from '@renegade-fi/core'
import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'
import { useStatus } from './useStatus.js'
import { useWalletId } from './useWalletId.js'

export type UseWalletParameters = {
  config?: Config
  onUpdate?: (wallet: Wallet) => void
  enabled?: boolean
}

export function useWalletWebsocket(parameters: UseWalletParameters = {}) {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const walletId = useWalletId()
  const { getWebsocketBaseUrl } = config
  const { enabled = true, onUpdate } = parameters

  const { readyState, sendJsonMessage } = useWebSocket.default(
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
        } catch (_) { }
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
      status !== 'in relayer'
    )
      return

    const body = {
      method: 'subscribe',
      topic: WALLET_ROUTE(walletId),
    }
    const symmetricKey = getSymmetricKey(config)
    const [auth, expiration] = config.utils.build_auth_headers_symmetric(
      symmetricKey,
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
  }, [readyState, walletId, status, sendJsonMessage, config, enabled])
}
