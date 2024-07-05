import type { Config } from '../createConfig.js'
import type { OrderMetadata } from '../types/order.js'
import { ADMIN_OPEN_ORDERS_ROUTE } from '../constants.js'
import { getRelayerWithAdmin } from '../utils/http.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'

export type GetOpenOrdersReturnType = Map<string, OrderMetadata>

export type GetOpenOrdersErrorType = BaseErrorType

export async function getOpenOrders(
  config: Config,
): Promise<GetOpenOrdersReturnType> {
  const { getRelayerBaseUrl } = config

  const res = await getRelayerWithAdmin(
    config,
    getRelayerBaseUrl(ADMIN_OPEN_ORDERS_ROUTE),
  )

  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: OrderMetadata) => [order.id, order]))
}
