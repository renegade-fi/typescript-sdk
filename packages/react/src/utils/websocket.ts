import { SIG_EXPIRATION_BUFFER_MS } from '@renegade-fi/core'
import { addExpiringAuthToHeaders } from '@renegade-fi/core'
import type {
  Config,
  SubscriptionBody,
  UnsubscriptionBody,
} from '@renegade-fi/core'

export function createSignedWebSocketRequest(
  config: Config,
  key: `0x${string}`,
  body: SubscriptionBody | UnsubscriptionBody,
) {
  const headers = addExpiringAuthToHeaders(
    config,
    body.topic,
    {},
    JSON.stringify(body),
    key,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return {
    headers,
    body,
  }
}
