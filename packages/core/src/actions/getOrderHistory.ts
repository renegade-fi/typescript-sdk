import { ORDER_HISTORY_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { OrderMetadata } from '../types/order.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type GetOrderHistoryReturnType = Map<string, OrderMetadata>

export type GetOrderHistoryErrorType = BaseErrorType

export async function getOrderHistory(
  config: Config,
): Promise<GetOrderHistoryReturnType> {
  const { getRelayerBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(ORDER_HISTORY_ROUTE(walletId)),
  )
  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: OrderMetadata) => [order.id, order]))
}
