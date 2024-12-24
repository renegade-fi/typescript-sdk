import { GET_ORDER_BY_ID_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Order } from '../types/order.js'
import { getRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type GetOrderParameters = { id: string }

export type GetOrderReturnType = Order

export async function getOrder(
  config: Config,
  parameters: GetOrderParameters,
): Promise<GetOrderReturnType> {
  const { id } = parameters
  const { getBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getBaseUrl(GET_ORDER_BY_ID_ROUTE(walletId, id)),
  )
  return res.order
}
