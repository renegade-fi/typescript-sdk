import { getRelayerRaw } from '../utils/http.js'

import { GET_NETWORK_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { NetworkOrder } from '../types/wallet.js'

export type GetNetworkOrdersReturnType = Promise<NetworkOrder[]>

export async function getNetworkOrders(
  config: Config,
): GetNetworkOrdersReturnType {
  const { getRelayerBaseUrl } = config
  const res = await getRelayerRaw(getRelayerBaseUrl(GET_NETWORK_ORDERS_ROUTE))
  return res.orders
}
