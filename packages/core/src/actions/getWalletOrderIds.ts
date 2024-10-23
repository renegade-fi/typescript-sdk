import { ADMIN_WALLET_ORDER_IDS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import { getRelayerWithAdmin } from '../utils/http.js'

export type GetWalletOrderIdsParameters = {
  id: string
}

export type GetWalletOrderIdsReturnType = string[]

export type GetWalletOrderIdsErrorType = BaseErrorType

export async function getWalletOrderIds(
  config: Config,
  parameters: GetWalletOrderIdsParameters,
): Promise<GetWalletOrderIdsReturnType> {
  const { id } = parameters
  const { getRelayerBaseUrl } = config

  const res = await getRelayerWithAdmin(
    config,
    getRelayerBaseUrl(ADMIN_WALLET_ORDER_IDS_ROUTE(id)),
  )

  if (!res.order_ids) {
    throw new BaseError('No orders found')
  }

  return res.order_ids
}
