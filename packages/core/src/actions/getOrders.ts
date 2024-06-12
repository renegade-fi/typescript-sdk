import { WALLET_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Order } from '../types/order.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getSkRoot } from './getSkRoot.js'

export type GetOrdersReturnType = Order[]

export async function getOrders(config: Config): Promise<GetOrdersReturnType> {
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config)
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
  )
  return res.orders
}
