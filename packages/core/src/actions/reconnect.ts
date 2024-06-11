import invariant from 'tiny-invariant'
import type { Config } from '../createConfig.js'
import { getWalletFromRelayer } from './getWalletFromRelayer.js'

export async function reconnect(config: Config) {
  try {
    invariant(config.state.seed, 'No seed found')
    invariant(config.state.id, 'No id found')
    invariant(config.state.status === 'in relayer', 'Not previously connected')
    const wallet = await getWalletFromRelayer(config)
    if (wallet) {
      console.log('🚝 Reconnecting on mount')
      config.setState((x) => ({
        ...x,
        status: 'in relayer',
      }))
      console.log('Wallet found in relayer', {
        status: 'in relayer',
        walletId: wallet.id,
      })
    }
  } catch (error) {
    console.error('Could not reconnect', { error })
    config.setState({})
  }
}
