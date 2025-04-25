import type { RenegadeConfig } from '../createConfig.js'
import {
  type AuthType,
  RelayerWebsocket,
  type RelayerWebsocketParams,
} from './websocket.js'

export type WebsocketWaiterParams = {
  config: RenegadeConfig
  topic: string
  authType: AuthType
  messageHandler: (message: any) => any | undefined
  prefetch?: () => Promise<any | undefined>
  timeout?: number
}

/**
 * A lightweight method which resolves when a short-lived websocket connection is closed.
 *
 * The method will open the websocket connection, subscribe to the given topic
 * (sending a subscription message in the format expected by the relayer),
 * and close it when the message handler returns a value, resolving the promise with the value.
 *
 * The message handler should return undefined *only* if the message is not relevant to the waiter.
 * If the message satisfies the waiter's criteria but no return value is needed, the handler
 * should return null.
 *
 * The message handler is also responsible for parsing the message, to give it control over e.g. how
 * bigint values are parsed.
 *
 * Additionally, the method accepts an async `prefetch` function which can be used ahead of the websocket
 * connection being opened to fetch a value which will be returned immediately if it is not undefined.
 *
 * If the timeout is reached, the promise will reject.
 *
 * Because this method is intended for short-lived websocket connections, it does not support reconnecting to the server.
 * If the connection is closed, the method will throw an error.
 */
export async function websocketWaiter<T>(
  params: WebsocketWaiterParams,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let promiseSettled = false

    const wsParams: RelayerWebsocketParams = {
      config: params.config,
      topic: params.topic,
      authType: params.authType,
      onmessage: function (this: WebSocket, event: MessageEvent) {
        try {
          const result = params.messageHandler(event.data)
          if (result !== undefined) {
            promiseSettled = true
            this.close()
            resolve(result)
          }
        } catch (error) {
          promiseSettled = true
          this.close()
          reject(error)
        }
      },
      oncloseCallback: () => {
        if (!promiseSettled) {
          promiseSettled = true
          reject(new Error('Websocket connection closed'))
        }
      },
      onerrorCallback: (error: Event | Error) => {
        if (!promiseSettled) {
          promiseSettled = true
          reject(error)
        }
      },
    }

    const ws = new RelayerWebsocket(wsParams)
    ws.connect().catch((error) => reject(error))

    if (params.timeout) {
      setTimeout(() => {
        if (!promiseSettled) {
          promiseSettled = true
          ws.close()
          reject(new Error('Websocket connection timed out'))
        }
      }, params.timeout)
    }

    if (params.prefetch) {
      params
        .prefetch()
        .then((result) => {
          if (result) {
            promiseSettled = true
            ws.close()
            resolve(result)
          }
        })
        .catch((error) => {
          if (!promiseSettled) {
            promiseSettled = true
            ws.close()
            reject(error)
          }
        })
    }
  })
}
