import { arbitrum, arbitrumSepolia } from 'viem/chains'

type ConfigDefaults = {
  hseBaseUrl: string
}

const SUPPORTED_CHAINS = [arbitrum.id, arbitrumSepolia.id] as const
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]

const CHAIN_DEFAULTS: Record<SupportedChainId, ConfigDefaults> = {
  [arbitrum.id]: {
    hseBaseUrl: 'https://mainnet.historical-state.renegade.fi:3000',
  },
  [arbitrumSepolia.id]: {
    hseBaseUrl: 'https://testnet.historical-state.renegade.fi:3000',
  },
}

export function getHseBaseUrl(chainId: SupportedChainId): string {
  const defaults = CHAIN_DEFAULTS[chainId]
  if (!defaults) {
    throw new Error(`No HSE base URL found for chain ID ${chainId}`)
  }

  return defaults.hseBaseUrl
}

// Utility function to check if a chain ID is supported
export function isSupportedChainId(
  chainId: number,
): chainId is SupportedChainId {
  return SUPPORTED_CHAINS.some((chain) => chain === chainId)
}
