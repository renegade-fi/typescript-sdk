import { getSymmetricKey } from '../actions/getSymmetricKey.js'
import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_AUTH_HMAC_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
} from '../constants.js'
import type { Config } from '../createConfig.js'

export enum AuthType {
  None = 'None',
  Wallet = 'Wallet',
  Admin = 'Admin',
}

export type RelayerWebsocketParams = {
  config: Config
  topic: string
  authType: AuthType
  onmessage: (this: WebSocket, ev: MessageEvent) => any
  onopenCallback?: (this: WebSocket, ev: Event) => any
  oncloseCallback?: (this: WebSocket, ev: CloseEvent) => any
  onerrorCallback?: (this: WebSocket, ev: Event) => any
}

export class RelayerWebsocket {
  private config: Config
  private topic: string
  private authType: AuthType
  private onmessage: (this: WebSocket, ev: MessageEvent) => any
  private onopenCallback: ((this: WebSocket, ev: Event) => any) | null
  private oncloseCallback: ((this: WebSocket, ev: CloseEvent) => any) | null
  private onerrorCallback: ((this: WebSocket, ev: Event) => any) | null

  private ws: WebSocket | null = null

  constructor(params: RelayerWebsocketParams) {
    this.config = params.config
    this.topic = params.topic
    this.authType = params.authType
    this.onmessage = params.onmessage
    this.onopenCallback = params.onopenCallback ?? null
    this.oncloseCallback = params.oncloseCallback ?? null
    this.onerrorCallback = params.onerrorCallback ?? null
  }

  public connect(): void {
    if (this.ws) {
      throw new Error(
        'WebSocket connection attempt aborted: already connected.',
      )
    }

    const instance = this
    instance.ws = new WebSocket(this.config.getWebsocketBaseUrl())

    instance.ws.onopen = function (this: WebSocket, event: Event) {
      const message = buildSubscriptionMessage(
        instance.config,
        instance.topic,
        instance.authType,
      )
      this.send(JSON.stringify(message))

      return instance.onopenCallback?.call(this, event)
    }

    instance.ws.onmessage = instance.onmessage

    instance.ws.onclose = function (this: WebSocket, event: CloseEvent) {
      instance.cleanup()
      return instance.oncloseCallback?.call(this, event)
    }

    instance.ws.onerror = function (this: WebSocket, event: Event) {
      instance.cleanup()
      return instance.onerrorCallback?.call(this, event)
    }
  }

  public close(): void {
    if (!this.ws) {
      throw new Error('WebSocket connection not open')
    }

    this.ws.close()
  }

  private cleanup(): void {
    this.ws = null
  }
}

// -----------
// | Helpers |
// -----------

function buildSubscriptionMessage(
  config: Config,
  topic: string,
  authType: AuthType,
) {
  const body = {
    method: 'subscribe',
    topic,
  }

  if (authType === AuthType.None) {
    return body
  }

  if (authType === AuthType.Wallet) {
    const headers = buildWalletAuthHeaders(config, body)
    return {
      headers,
      body,
    }
  }

  if (authType === AuthType.Admin) {
    const headers = buildAdminAuthHeaders(config, body)
    return {
      headers,
      body,
    }
  }

  throw new Error(`Unsupported auth type: ${authType}`)
}

function buildWalletAuthHeaders(config: Config, body: any) {
  const symmetricKey = getSymmetricKey(config)
  const [auth, expiration] = config.utils.build_auth_headers_symmetric(
    symmetricKey,
    JSON.stringify(body),
    BigInt(Date.now()),
  )

  return {
    [RENEGADE_AUTH_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
  }
}

function buildAdminAuthHeaders(config: Config, body: any) {
  if (!config.adminKey) {
    throw new Error('Admin key is required')
  }

  const [auth, expiration] = config.utils.build_admin_headers(
    config.adminKey,
    JSON.stringify(body),
    BigInt(Date.now()),
  )

  return {
    [RENEGADE_AUTH_HMAC_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
  }
}
