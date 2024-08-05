import type { Config } from '../createConfig.js'
import type { OpenOrder } from '../types/order.js'
import { ADMIN_OPEN_ORDERS_ROUTE } from '../constants.js'
import { getRelayerWithAdmin } from '../utils/http.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'

export type GetOpenOrdersParams = {
  matchingPool?: string
  includeFillable?: boolean
}

export type GetOpenOrdersReturnType = Map<string, OpenOrder>

export type GetOpenOrdersErrorType = BaseErrorType

export async function getOpenOrders(
  config: Config,
  parameters: GetOpenOrdersParams = {},
): Promise<GetOpenOrdersReturnType> {
  const { getRelayerBaseUrl } = config

  const url = new URL(getRelayerBaseUrl(ADMIN_OPEN_ORDERS_ROUTE))

  if (parameters.matchingPool) {
    url.searchParams.set('matching_pool', parameters.matchingPool)
  }

  if (parameters.includeFillable) {
    url.searchParams.set('include_fillable', String(true))
  }

  const res = await getRelayerWithAdmin(config, url.toString())

  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: OpenOrder) => [order.order.id, order]))
}
