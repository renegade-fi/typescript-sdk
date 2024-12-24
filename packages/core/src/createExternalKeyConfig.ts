import invariant from 'tiny-invariant'
import type { SignMessageReturnType } from 'viem'
import { type BaseConfig, keyTypes } from './createConfig.js'
import type * as rustUtils from './utils.d.ts'

export type CreateExternalKeyConfigParameters = {
  /** URL of the relayer service */
  relayerUrl: string
  /** URL of the websocket service */
  websocketUrl: string
  /**
   * Function to sign messages using the user's own wallet.
   * This function receives the message as is, without hashing it.
   * ECDSA standards should be followed i.e. `v` should be `0x00` or `0x01`
   *
   */
  signMessage: (message: string) => Promise<SignMessageReturnType>
  // Wallet secrets generated by offline script
  symmetricKey: `0x${string}`
  walletId: string
  publicKey: `0x${string}`
  utils?: typeof rustUtils
}

/**
 * Creates a configuration for users who want to manage their own wallet secrets.
 *
 * This configuration differs from the standard createConfig by allowing users to maintain
 * custody of their wallet secrets while still enabling interaction with the relayer for
 * wallet operations. Instead of managing keys internally, it accepts user-provided
 * cryptographic materials and signing functions.
 */
export function createExternalKeyConfig(
  parameters: CreateExternalKeyConfigParameters,
): ExternalKeyConfig {
  const {
    relayerUrl,
    signMessage,
    symmetricKey,
    walletId,
    publicKey,
    websocketUrl,
  } = parameters
  invariant(
    parameters.utils,
    'Utils must be provided by the package if not supplied by the user.',
  )
  return {
    // External keychain
    signMessage,
    symmetricKey,
    walletId,
    publicKey,
    // BaseConfig
    utils: parameters.utils,
    renegadeKeyType: keyTypes.EXTERNAL,
    relayerUrl,
    getBaseUrl: (route = '') => {
      const formattedRoute = route.startsWith('/') ? route : `/${route}`
      return `${relayerUrl}/v0${formattedRoute}`
    },
    getWebsocketBaseUrl: () => {
      return websocketUrl.replace(/\/$/, '')
    },
    getSymmetricKey: () => {
      return symmetricKey
    },
  }
}

export type ExternalKeyConfig = BaseConfig & {
  relayerUrl: string
  signMessage: (message: string) => Promise<SignMessageReturnType>
  symmetricKey: `0x${string}`
  walletId: string
  publicKey: `0x${string}`
  getBaseUrl: (route?: string) => string
}
