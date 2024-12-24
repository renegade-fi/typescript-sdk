import invariant from 'tiny-invariant'
import type { BaseConfig } from './createConfig.js'
import type * as rustUtils from './utils.d.ts'

export type CreateAuthConfigParameters = {
  apiKey: string
  apiSecret: string
  authServerUrl: string
  utils?: typeof rustUtils
}

/**
 * Creates a configuration object specifically for authenticating with the relayer authentication server.
 * This is distinct from the main config (created by `createConfig`) which handles wallet operations.
 *
 * While `createConfig` is used for wallet-related interactions with the relayer (like creating orders
 * or managing wallet state), this auth config is solely for endpoints that require API key authentication,
 * such as external match requests of external orders.
 */
export function createAuthConfig(
  parameters: CreateAuthConfigParameters,
): AuthConfig {
  const { apiKey, apiSecret, authServerUrl } = parameters
  invariant(
    parameters.utils,
    'Utils must be provided by the package if not supplied by the user.',
  )
  return {
    utils: parameters.utils,
    apiKey,
    apiSecret,
    getBaseUrl: (route = '') => {
      const formattedRoute = route.startsWith('/') ? route : `/${route}`
      return `${authServerUrl}/v0${formattedRoute}`
    },
    getWebsocketBaseUrl: () => {
      throw new Error('Not implemented')
    },
  }
}

export type AuthConfig = BaseConfig & {
  apiSecret: string
  apiKey: string
  getBaseUrl: (route?: string) => string
}
