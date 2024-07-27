'use client'

import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
  WS_TASK_HISTORY_ROUTE,
  getSkRoot,
  parseBigJSON,
  type Config,
  type Task,
} from '@renegade-fi/core'
import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useConfig } from './useConfig.js'
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
        } catch (_) { }
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
      status !== 'in relayer'
    ) return

    const body = {
      method: 'subscribe',
      topic: WS_TASK_HISTORY_ROUTE(walletId),
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
  }, [readyState, status, sendJsonMessage, config, walletId, enabled])
}
