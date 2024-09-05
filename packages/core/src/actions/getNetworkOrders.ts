import { getRelayerRaw } from '../utils/http.js'

import { GET_NETWORK_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { NetworkOrder } from '../types/wallet.js'

export type GetNetworkOrdersReturnType = Map<string, NetworkOrder>

export type GetNetworkOrdersErrorType = BaseErrorType

export async function getNetworkOrders(
  config: Config,
): Promise<GetNetworkOrdersReturnType> {
  const { getRelayerBaseUrl } = config
  const res = await getRelayerRaw(getRelayerBaseUrl(GET_NETWORK_ORDERS_ROUTE))
  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: NetworkOrder) => [order.id, order]))
}
