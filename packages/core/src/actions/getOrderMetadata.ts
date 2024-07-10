import type { Config } from '../createConfig.js'
import type { OrderMetadata } from '../types/order.js'
import { ADMIN_ORDER_METADATA_ROUTE } from '../constants.js'
import { getRelayerWithAdmin } from '../utils/http.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'

export type GetOrderMetadataParameters = { id: string }

export type GetOrderMetadataReturnType = OrderMetadata

export type GetOrderMetadataErrorType = BaseErrorType

export async function getOrderMetadata(
  config: Config,
  parameters: GetOrderMetadataParameters,
): Promise<GetOrderMetadataReturnType> {
  const { id } = parameters
  const { getRelayerBaseUrl } = config

  const res = await getRelayerWithAdmin(
    config,
    getRelayerBaseUrl(ADMIN_ORDER_METADATA_ROUTE(id)),
  )

  if (!res.orders) {
    throw new BaseError('No orders found')
  }
  return res.order
}
