import type { Hex } from 'viem'
import { createWallet } from './createWallet.js'
import { getWalletFromRelayer } from './getWalletFromRelayer.js'
import { getWalletId } from './getWalletId.js'
import { lookupWallet, lookupWalletOnChain } from './lookupWallet.js'

import type { Config } from '../createConfig.js'

export type ConnectParameters = { seed?: Hex }

export type ConnectReturnType = Promise<{
  isLookup: boolean
  job: Promise<void>
} | null>

export async function connect(
  config: Config,
  parameters: ConnectParameters = {},
): ConnectReturnType {
  const { seed } = parameters
  let walletId = config.state.id
  try {
    walletId = getWalletId(config, { seed })
  } catch (error: any) {
    console.error('Error getting wallet id', {
      errorStack: error.stack,
      errorMessage: error.message,
      walletId,
      seed,
    })
    throw error
  }

  console.log('Attempting to connect wallet', { walletId })

  try {
    const wallet = await getWalletFromRelayer(config, { seed })
    if (wallet) {
      config.setState({ ...config.state, status: 'in relayer', id: wallet.id })
      console.log('Wallet found in relayer', {
        status: 'in relayer',
        walletId: wallet.id,
      })
      return Promise.resolve(null)
    }
  } catch (error) {
    console.error('Error getting wallet from relayer', { error, walletId })
  }

  // If wallet on chain, start lookup wallet task
  const isOnChain = await lookupWalletOnChain(config)
  if (isOnChain) {
    return Promise.resolve({
      isLookup: true,
      job: lookupWallet(config, { seed }),
    })
  }

  // If wallet not in relayer or on chain, call createWallet
  return Promise.resolve({
    isLookup: false,
    job: createWallet(config, { seed }),
  })
}
