import type { Config } from '../createConfig.js'
import { createWallet } from './createWallet.js'
import { getWalletFromRelayer } from './getWalletFromRelayer.js'
import { getWalletId } from './getWalletId.js'
import { lookupWallet, lookupWalletOnChain } from './lookupWallet.js'

export type ConnectReturnType = {
  isLookup: boolean
  job: Promise<void>
} | void

export async function connect(config: Config): Promise<ConnectReturnType> {
  try {
    const walletId = getWalletId(config)
    config.setState((x) => ({ ...x, id: walletId }))

    console.log('Attempting to connect wallet', { walletId: config.state.id })

    try {
      const wallet = await getWalletFromRelayer(config)
      if (wallet) {
        config.setState((x) => ({ ...x, status: 'in relayer' }))
        console.log('Wallet found in relayer', {
          status: 'in relayer',
          walletId: config.state.id,
        })
        return
      }
    } catch (error) {
      console.error('Wallet not found in relayer', {
        error,
        walletId: config.state.id,
      })
    }

    // If wallet on chain, start lookup wallet task
    const isOnChain = await lookupWalletOnChain(config)
    if (isOnChain) {
      return Promise.resolve({
        isLookup: true,
        job: lookupWallet(config),
      })
    }

    // If wallet not in relayer or on chain, call createWallet
    return Promise.resolve({
      isLookup: false,
      job: createWallet(config),
    })
  } catch (error) {
    console.error('Could not connect wallet', {
      error,
      walletId: config.state.id,
    })
    config.setState({})
  }
}
