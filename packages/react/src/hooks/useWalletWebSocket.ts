'use client'

import {
  type Config,
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
  WALLET_ROUTE,
  type Wallet,
  parseBigJSON,
} from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'

import { getSkRoot, useStatus, useWalletId } from '../index.js'

export type UseWalletParameters = {
  config?: Config
}

export type UseWalletReturnType = Wallet | undefined

export function useWalletWebsocket(
  parameters: UseWalletParameters = {},
): UseWalletReturnType {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const walletId = useWalletId()
  const { getWebsocketBaseUrl } = config
  const [wallet, setWallet] = useState<Wallet>()

  const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(
    getWebsocketBaseUrl(),
    {
      share: true,
      shouldReconnect: () => true,
    },
  )

  // Subscribe to wallet updates with auth headers
  useEffect(() => {
    if (readyState !== ReadyState.OPEN || !walletId || status !== 'in relayer')
      return

    const body = {
      method: 'subscribe',
      topic: WALLET_ROUTE(walletId),
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
  }, [readyState, walletId, status, sendJsonMessage, config])

  useEffect(() => {
    if (lastMessage && walletId) {
      try {
        const messageData = parseBigJSON(lastMessage.data)
        if (
          messageData.topic === WALLET_ROUTE(walletId) &&
          messageData.event?.type === 'WalletUpdate' &&
          messageData.event?.wallet
        )
          setWallet(messageData.event.wallet)
      } catch (error) {
        console.error(
          'Error parsing data in WebSocket:',
          lastMessage.data,
          error,
        )
      }
    }
  }, [lastMessage, walletId])

  return wallet
}
