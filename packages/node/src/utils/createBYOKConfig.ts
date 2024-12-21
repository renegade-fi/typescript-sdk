import type { BaseConfig } from '@renegade-fi/core'
import invariant from 'tiny-invariant'
import type { SignMessageReturnType } from 'viem'
import type * as rustUtils from '../../renegade-utils/index.js'

/**
 * Configuration parameters for Bring Your Own Keychain (BYOK) setup.
 * Unlike the default configuration, BYOK allows users to maintain custody of their own wallet secrets
 * while still interacting with the relayer for wallet operations.
 */
export type CreateBYOKConfigParameters = {
  /** URL of the relayer service */
  relayerUrl: string
  /**
   * Function to sign messages using the user's own wallet.
   *
   * Important requirements for the signing function:
   * 1. The function receives a pre-hashed message (using keccak256) - do not hash the message again
   * 2. Do not prefix the message - sign it as is
   * 3. The signature must use `0x00` or `0x01` for the `v` value (y-parity)
   *    Do not use Ethereum-specific values `0x1b` or `0x1c` which add an offset of 27
   * 4. When using libraries like viem, avoid using `serializeSignature` as it normalizes `v` to `0x1b`/`0x1c`
   *    Instead, manually construct the 65-byte signature by concatenating `r`, `s`, and recovery byte (`0x00`/`0x01`)
   */
  signMessage: (message: string) => Promise<SignMessageReturnType>
  /** User-provided symmetric key for encryption */
  symmetricKey: `0x${string}`
  /** Identifier for the wallet */
  walletId: string
  /** Public key associated with the wallet */
  publicKey: `0x${string}`
  /** Utils implementation */
  utils?: typeof rustUtils
}

/**
 * Creates a configuration for users who want to bring their own keychain (BYOK).
 *
 * This configuration differs from the standard createConfig by allowing users to maintain
 * custody of their wallet secrets while still enabling interaction with the relayer for
 * wallet operations. Instead of managing keys internally, it accepts user-provided
 * cryptographic materials and signing functions.
 *
 * The signing function provided must follow specific requirements for signature generation
 * to ensure compatibility with the underlying cryptographic operations. See the documentation
 * for `signMessage` in CreateBYOKConfigParameters for detailed requirements.
 *
 * @param parameters - Configuration parameters including relayer URL, signing function, and keys
 * @returns A configuration object that can be used to interact with the relayer
 */
export function createBYOKConfig(
  parameters: CreateBYOKConfigParameters,
): BYOKConfig {
  const { relayerUrl, signMessage, symmetricKey, walletId, publicKey } =
    parameters
  invariant(
    parameters.utils,
    'Utils must be provided by the package if not supplied by the user.',
  )
  return {
    // BYOK
    signMessage,
    symmetricKey,
    walletId,
    publicKey,
    // BaseConfig
    getRelayerBaseUrl: (route = '') => {
      const formattedRoute = route.startsWith('/') ? route : `/${route}`
      return `${relayerUrl}/v0${formattedRoute}`
    },
    utils: parameters.utils,
    relayerUrl,
  }
}

export type BYOKConfig = BaseConfig & {
  getRelayerBaseUrl: (route?: string) => string
  relayerUrl: string
  signMessage: (message: string) => Promise<SignMessageReturnType>
  symmetricKey: `0x${string}`
  walletId: string
  publicKey: `0x${string}`
}
