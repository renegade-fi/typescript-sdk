import type { Hex } from 'viem'
import { getSkRoot } from './getSkRoot.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { GET_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Balance, Order, Wallet } from '../types/wallet.js'

export type GetWalletFromRelayerParameters = {
  seed?: Hex
  filterDefaults?: boolean
}

export type GetWalletFromRelayerReturnType = Promise<Wallet | undefined>

export async function getWalletFromRelayer(
  config: Config,
  parameters: GetWalletFromRelayerParameters = {},
): GetWalletFromRelayerReturnType {
  const { filterDefaults, seed } = parameters
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config, { seed })
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(GET_WALLET_ROUTE(walletId)),
  )
  if (res.wallet) {
    config.setState({
      ...config.state,
      status: 'in relayer',
      id: res.wallet.id,
    })
    if (filterDefaults) {
      return {
        ...res.wallet,
        balances: res.wallet.balances.filter(
          (b: Balance) =>
            b.amount || b.protocol_fee_balance || b.relayer_fee_balance,
        ),
        orders: res.wallet.orders.filter((o: Order) => o.amount),
      }
    }
    return res.wallet
  }
  return
}
