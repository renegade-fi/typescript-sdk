import {
  ORDER_HISTORY_LEN_PARAM,
  ORDER_HISTORY_ROUTE,
  postWithSymmetricKey,
} from '@renegade-fi/core'
import type { BaseErrorType } from 'viem'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'
import type { OrderMetadata } from '@renegade-fi/core'

export type GetOrderHistoryParameters = {
  limit?: number
}

export type GetOrderHistoryReturnType = Promise<Map<string, OrderMetadata>>

export type GetOrderHistoryErrorType = BaseErrorType

export async function getOrderHistory(
  config: BYOKConfig,
  parameters: GetOrderHistoryParameters = {},
): GetOrderHistoryReturnType {
  const { getRelayerBaseUrl, symmetricKey, walletId } = config
  const { limit } = parameters

  let url = getRelayerBaseUrl(ORDER_HISTORY_ROUTE(walletId))

  if (limit !== undefined) {
    const searchParams = new URLSearchParams({
      [ORDER_HISTORY_LEN_PARAM]: limit.toString(),
    })
    url += `?${searchParams.toString()}`
  }

  try {
    const res = await postWithSymmetricKey(config, {
      body: "",
      key: symmetricKey,
      url,
    })

    if (!res.orders) {
      throw new Error('No orders found')
    }
    return new Map(res.orders.map((order: OrderMetadata) => [order.id, order]))
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
} 