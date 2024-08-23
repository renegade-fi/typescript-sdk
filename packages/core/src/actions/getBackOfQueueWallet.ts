import { BACK_OF_QUEUE_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { Order } from '../types/order.js'
import type { Balance, Wallet } from '../types/wallet.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type GetBackOfQueueWalletParameters = {
  filterDefaults?: boolean
}

export type GetBackOfQueueWalletReturnType = Wallet

export type GetBackOfQueueWalletErrorType = BaseErrorType

export async function getBackOfQueueWallet(
  config: Config,
  parameters: GetBackOfQueueWalletParameters = {},
): Promise<GetBackOfQueueWalletReturnType> {
  const { filterDefaults } = parameters
  const { getRelayerBaseUrl, } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(BACK_OF_QUEUE_WALLET_ROUTE(walletId)),
  )
  if (!res.wallet) {
    throw new BaseError('Back of queue wallet not found')
  }
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
