import { ORDER_HISTORY_LEN_PARAM, ORDER_HISTORY_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { OrderMetadata } from '../types/order.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type GetOrderHistoryParameters = {
  limit?: number
}

export type GetOrderHistoryReturnType = Map<string, OrderMetadata>

export type GetOrderHistoryErrorType = BaseErrorType

export async function getOrderHistory(
  config: RenegadeConfig,
  parameters: GetOrderHistoryParameters = {},
): Promise<GetOrderHistoryReturnType> {
  const { getBaseUrl } = config
  const { limit } = parameters
  const walletId = getWalletId(config)

  let url = getBaseUrl(ORDER_HISTORY_ROUTE(walletId))

  if (limit !== undefined) {
    const searchParams = new URLSearchParams({
      [ORDER_HISTORY_LEN_PARAM]: limit.toString(),
    })
    url += `?${searchParams.toString()}`
  }
  const res = await getRelayerWithAuth(config, url)

  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return new Map(res.orders.map((order: OrderMetadata) => [order.id, order]))
}
