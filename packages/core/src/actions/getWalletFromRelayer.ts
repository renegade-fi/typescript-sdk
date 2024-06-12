import { GET_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { Order } from '../types/order.js'
import type { Balance, Wallet } from '../types/wallet.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getSkRoot } from './getSkRoot.js'

export type GetWalletFromRelayerParameters = {
  filterDefaults?: boolean
}

export type GetWalletFromRelayerReturnType = Wallet

export type GetWalletFromRelayerErrorType = BaseErrorType

export async function getWalletFromRelayer(
  config: Config,
  parameters: GetWalletFromRelayerParameters = {},
): Promise<GetWalletFromRelayerReturnType> {
  const { filterDefaults } = parameters
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config)
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(GET_WALLET_ROUTE(walletId)),
  )
  if (!res.wallet) {
    throw new BaseError('Wallet not found')
  }
  config.setState((x) => ({
    ...x,
    status: 'in relayer',
  }))
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
