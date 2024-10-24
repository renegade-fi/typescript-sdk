'use client'

import {
  type Config,
  SIG_EXPIRATION_BUFFER_MS,
  type Task,
  WS_TASK_HISTORY_ROUTE,
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

export type UseTaskHistoryWebSocketParameters = {
  config?: Config
  onUpdate?: (task: Task) => void
  enabled?: boolean
}

export function useTaskHistoryWebSocket(
  parameters: UseTaskHistoryWebSocketParameters = {},
) {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const walletId = useWalletId()
  const { getWebsocketBaseUrl } = config
  const { enabled = true, onUpdate } = parameters
  const initialized = useInitialized()

  const { readyState, sendJsonMessage } = useWebSocket.default(
    getWebsocketBaseUrl(),
    {
      filter: () => false,
      onMessage(event) {
        try {
          const messageData = parseBigJSON(event.data)
          if (
            walletId &&
            messageData.topic === WS_TASK_HISTORY_ROUTE(walletId) &&
            messageData.event?.type === 'TaskHistoryUpdate' &&
            messageData.event?.task
          )
            onUpdate?.(messageData.event.task)
        } catch (_) {}
      },
      share: true,
      shouldReconnect: () => true,
    },
    enabled,
  )

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
      topic: WS_TASK_HISTORY_ROUTE(walletId),
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
    status,
    sendJsonMessage,
    config,
    walletId,
    enabled,
    initialized,
  ])
}
