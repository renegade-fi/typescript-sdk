import { getSymmetricKey } from '../actions/getSymmetricKey.js'
import { SIG_EXPIRATION_BUFFER_MS } from '../constants.js'
import type { BYOKConfig } from '../createBYOKConfig.js'
import type { BaseConfig, Config } from '../createConfig.js'
import { addExpiringAuthToHeaders } from './http.js'

export enum AuthType {
  None = 'None',
  Wallet = 'Wallet',
  Admin = 'Admin',
  BYOK = 'BYOK',
}

export type RelayerWebsocketParams = {
  config: BaseConfig
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

export type SubscriptionBody = {
  method: 'subscribe'
  topic: string
}

export type UnsubscriptionBody = {
  method: 'unsubscribe'
  topic: string
}

export class RelayerWebsocket {
  private config: BaseConfig
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

    if (this.authType === AuthType.BYOK) {
      const headers = this.buildBYOKAuthHeaders(body)
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
    const symmetricKey = getSymmetricKey(this.config as Config)

    return addExpiringAuthToHeaders(
      this.config,
      body.topic,
      {}, // Headers
      JSON.stringify(body),
      symmetricKey,
      SIG_EXPIRATION_BUFFER_MS,
    )
  }

  private buildAdminAuthHeaders(
    body: SubscriptionBody,
  ): Record<string, string> {
    const config = this.config as Config
    if (!config.adminKey) {
      throw new Error('Admin key is required')
    }
    const { adminKey } = config
    const symmetricKey = config.utils.b64_to_hex_hmac_key(adminKey)

    return addExpiringAuthToHeaders(
      this.config,
      body.topic,
      {}, // Headers
      JSON.stringify(body),
      symmetricKey,
      SIG_EXPIRATION_BUFFER_MS,
    )
  }

  private buildBYOKAuthHeaders(body: SubscriptionBody): Record<string, string> {
    const symmetricKey = (this.config as BYOKConfig).symmetricKey
    return addExpiringAuthToHeaders(
      this.config,
      body.topic,
      {}, // Headers
      JSON.stringify(body),
      symmetricKey,
      SIG_EXPIRATION_BUFFER_MS,
    )
  }

  private cleanup(): void {
    this.ws = null
  }
}
