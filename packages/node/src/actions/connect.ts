import type { Hex } from 'viem'
import { lookupWallet, lookupWalletOnChain } from './lookupWallet.js'
import {
  getWalletId,
  type Config,
  getWalletFromRelayer,
  disconnect,
} from '@renegade-fi/core'
import { createWallet } from './createWallet.js'

export type ConnectParameters = { seed?: Hex }

export type ConnectReturnType = Promise<void>

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

  console.log(`Attempting to connect wallet ${walletId}`)

  try {
    const wallet = await getWalletFromRelayer(config, { seed })
    if (wallet) {
      config.setState({ ...config.state, status: 'in relayer', id: wallet.id })
      console.log('Wallet found in relayer', {
        status: 'in relayer',
        walletId: wallet.id,
      })
      return
    }
  } catch (error) {
    console.error('Error getting wallet from relayer', { error, walletId })
  }

  // If wallet on chain, start lookup wallet task
  const isOnChain = await lookupWalletOnChain(config)
  if (isOnChain) {
    await lookupWallet(config, { seed })
    const wallet = await getWalletFromRelayer(config, { seed })
    if (wallet) {
      config.setState({
        ...config.state,
        status: 'in relayer',
        id: wallet.id,
      })
    } else {
      console.error('Failed to lookup wallet')
      disconnect(config)
    }
    return
  }

  // If wallet not in relayer or on chain, call createWallet
  await createWallet(config)
  const wallet = await getWalletFromRelayer(config)
  if (wallet) {
    config.setState({ ...config.state, id: wallet.id, status: 'in relayer' })
  } else {
    console.error('create wallet failed')
    disconnect(config)
  }
}
