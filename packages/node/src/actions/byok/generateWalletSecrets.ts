import type { Config } from '@renegade-fi/core'
import type { SignMessageReturnType } from 'viem'

export interface GeneratedSecrets {
  wallet_id: string // UUID as string
  blinder_seed: `0x${string}` // Hex string
  share_seed: `0x${string}` // Hex string
  symmetric_key: `0x${string}` // Hex string
  sk_match: `0x${string}` // Hex string
}

export async function generateWalletSecrets(
  config: Config,
  signMessage: (message: string) => Promise<SignMessageReturnType>,
  publicKey: string,
): Promise<GeneratedSecrets> {
  const { utils } = config
  console.log('Generating wallet secrets for public key:', publicKey)
  const secrets = await utils.generate_wallet_secrets(signMessage, publicKey)
  const parsedSecrets = JSON.parse(secrets) as GeneratedSecrets
  return parsedSecrets
}
