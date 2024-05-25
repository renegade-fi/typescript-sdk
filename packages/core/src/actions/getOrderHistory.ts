import { getSkRoot } from './getSkRoot.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { ORDER_HISTORY_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { OrderMetadata } from '../types/wallet.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'

export type GetOrderHistoryReturnType = Map<string, OrderMetadata>

export type GetOrderHistoryErrorType = BaseErrorType

export async function getOrderHistory(
  config: Config,
): Promise<GetOrderHistoryReturnType> {
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config)
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(ORDER_HISTORY_ROUTE(walletId)),
  )
  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: OrderMetadata) => [order.id, order]))
}
