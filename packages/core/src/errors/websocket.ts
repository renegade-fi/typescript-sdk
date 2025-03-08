import { BaseError } from './base.js'

export type SocketClosedErrorType = SocketClosedError & {
  name: 'SocketClosedError'
}
export class SocketClosedError extends BaseError {
  constructor({
    url,
  }: {
    url?: string | undefined
  } = {}) {
    super('The socket has been closed.', {
      metaMessages: [url && `URL: ${url}`].filter(Boolean) as string[],
      name: 'SocketClosedError',
    })
  }
}

export type WebSocketRequestErrorType = WebSocketRequestError & {
  name: 'WebSocketRequestError'
}
export class WebSocketRequestError extends BaseError {
  constructor({
    body,
    cause,
    details,
    url,
  }: {
    body?: { [key: string]: unknown } | undefined
    cause?: Error | undefined
    details?: string | undefined
    url: string
  }) {
    super('WebSocket request failed.', {
      cause,
      details,
      metaMessages: [
        `URL: ${url}`,
        body && `Request body: ${JSON.stringify(body)}`,
      ].filter(Boolean) as string[],
      name: 'WebSocketRequestError',
    })
  }
}

export type WebSocketConnectionErrorType = WebSocketConnectionError & {
  name: 'WebSocketConnectionError'
}

export class WebSocketConnectionError extends BaseError {
  constructor({
    url,
    cause,
    details,
  }: {
    url: string
    cause?: Error | undefined
    details?: string | undefined
  }) {
    super('Failed to establish WebSocket connection.', {
      cause,
      details,
      metaMessages: [`URL: ${url}`],
      name: 'WebSocketConnectionError',
    })
  }
}
