import type { SignMessageReturnType } from 'viem'
import { generate_wallet_secrets } from '../../../renegade-utils/index.js'

/**
 * Interface representing the cryptographic secrets generated for a wallet
 */
export interface GeneratedSecrets {
  /** Unique identifier for the wallet in UUID format */
  wallet_id: string

  /** Cryptographic seed for the wallet's blinder CSPRNG*/
  blinder_seed: `0x${string}`

  /** Cryptographic seed for the wallet's share CSPRNG */
  share_seed: `0x${string}`

  /** Encryption key for authenticating API requests */
  symmetric_key: `0x${string}`

  /** Secret key used for matching operations */
  sk_match: `0x${string}`
}

export async function generateWalletSecrets(
  signMessage: (message: string) => Promise<SignMessageReturnType>,
): Promise<GeneratedSecrets> {
  const secrets = await generate_wallet_secrets(signMessage)
  const parsedSecrets = JSON.parse(secrets) as GeneratedSecrets
  return parsedSecrets
}
