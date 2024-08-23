import { WALLET_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Order } from '../types/order.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type GetOrdersReturnType = Order[]

export async function getOrders(config: Config): Promise<GetOrdersReturnType> {
  const { getRelayerBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
  )
  return res.orders
}
