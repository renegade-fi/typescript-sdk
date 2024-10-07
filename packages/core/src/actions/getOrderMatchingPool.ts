import { ADMIN_GET_ORDER_MATCHING_POOL_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { getRelayerWithAdmin } from '../utils/http.js'

export type GetOrderMatchingPoolParameters = {
  orderId: string
}

export type GetOrderMatchingPoolReturnType = string

export async function getOrderMatchingPool(
  config: Config,
  parameters: GetOrderMatchingPoolParameters,
): Promise<GetOrderMatchingPoolReturnType> {
  const { orderId } = parameters
  const { getRelayerBaseUrl } = config

  try {
    const res = await getRelayerWithAdmin(
      config,
      getRelayerBaseUrl(ADMIN_GET_ORDER_MATCHING_POOL_ROUTE(orderId)),
    )

    return res.matching_pool
  } catch (error) {
    console.error(`Failed to get matching pool for order ${orderId}`, { error })

    throw error
  }
}
