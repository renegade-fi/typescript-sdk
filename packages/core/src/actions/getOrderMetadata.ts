import { ADMIN_ORDER_METADATA_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { AdminOrderMetadata } from '../types/order.js'
import { getRelayerWithAdmin } from '../utils/http.js'

export type GetOrderMetadataParameters = {
  id: string
  includeFillable?: boolean
}

export type GetOrderMetadataReturnType = AdminOrderMetadata

export type GetOrderMetadataErrorType = BaseErrorType

export async function getOrderMetadata(
  config: Config,
  parameters: GetOrderMetadataParameters,
): Promise<GetOrderMetadataReturnType> {
  const { id } = parameters
  const { getBaseUrl } = config

  const url = new URL(getBaseUrl(ADMIN_ORDER_METADATA_ROUTE(id)))

  if (parameters.includeFillable) {
    url.searchParams.set('include_fillable', String(true))
  }

  const res = await getRelayerWithAdmin(config, url.toString())

  if (!res.order) {
    throw new BaseError('No order found')
  }
  return res.order
}
