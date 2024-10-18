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

type SubscriptionMessage = {
  headers?: Record<string, string>
  body: SubscriptionBody
}

type UnsubscriptionMessage = {
  body: UnsubscriptionBody
}

type SubscriptionBody = {
  method: 'subscribe'
  topic: string
}

type UnsubscriptionBody = {
  method: 'unsubscribe'
  topic: string
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

  // --------------
  // | Public API |
  // --------------

  public connect(): void {
    if (this.ws) {
      throw new Error(
        'WebSocket connection attempt aborted: already connected.',
      )
    }

    const instance = this
    instance.ws = new WebSocket(this.config.getWebsocketBaseUrl())

    instance.ws.onopen = function (this: WebSocket, event: Event) {
      const message = instance.buildSubscriptionMessage()
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

    const message = this.buildUnsubscriptionMessage()
    this.ws.send(JSON.stringify(message))

    this.ws.close()
  }

  // ---------------
  // | Private API |
  // ---------------

  private buildSubscriptionMessage(): SubscriptionMessage {
    const body = {
      method: 'subscribe' as const,
      topic: this.topic,
    }

    if (this.authType === AuthType.None) {
      return { body }
    }

    if (this.authType === AuthType.Wallet) {
      const headers = this.buildWalletAuthHeaders(body)
      return {
        headers,
        body,
      }
    }

    if (this.authType === AuthType.Admin) {
      const headers = this.buildAdminAuthHeaders(body)
      return {
        headers,
        body,
      }
    }

    throw new Error(`Unsupported auth type: ${this.authType}`)
  }

  private buildUnsubscriptionMessage(): UnsubscriptionMessage {
    return {
      body: {
        method: 'unsubscribe' as const,
        topic: this.topic,
      },
    }
  }

  private buildWalletAuthHeaders(
    body: SubscriptionBody,
  ): Record<string, string> {
    const symmetricKey = getSymmetricKey(this.config)
    const [auth, expiration] = this.config.utils.build_auth_headers_symmetric(
      symmetricKey,
      JSON.stringify(body),
      BigInt(Date.now()),
    )

    return {
      [RENEGADE_AUTH_HEADER_NAME]: auth,
      [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    }
  }

  private buildAdminAuthHeaders(
    body: SubscriptionBody,
  ): Record<string, string> {
    if (!this.config.adminKey) {
      throw new Error('Admin key is required')
    }

    const [auth, expiration] = this.config.utils.build_admin_headers(
      this.config.adminKey,
      JSON.stringify(body),
      BigInt(Date.now()),
    )

    return {
      [RENEGADE_AUTH_HMAC_HEADER_NAME]: auth,
      [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    }
  }

  private cleanup(): void {
    this.ws = null
  }
}
