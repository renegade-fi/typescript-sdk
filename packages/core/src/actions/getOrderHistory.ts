import { getSkRoot } from './getSkRoot.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { ORDER_HISTORY_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { OrderMetadata } from '../types/wallet.js'

export type GetOrderHistoryReturnType = Promise<OrderMetadata[]>

export async function getOrderHistory(
  config: Config,
): GetOrderHistoryReturnType {
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config)
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(ORDER_HISTORY_ROUTE(walletId)),
  )
  return res.orders
}
