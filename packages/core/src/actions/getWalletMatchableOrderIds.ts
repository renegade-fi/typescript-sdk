import { ADMIN_WALLET_MATCHABLE_ORDER_IDS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import { getRelayerWithAdmin } from '../utils/http.js'

export type GetWalletMatchableOrderIdsParameters = {
  id: string
}

export type GetWalletMatchableOrderIdsReturnType = string[]

export type GetWalletMatchableOrderIdsErrorType = BaseErrorType

export async function getWalletMatchableOrderIds(
  config: Config,
  parameters: GetWalletMatchableOrderIdsParameters,
): Promise<GetWalletMatchableOrderIdsReturnType> {
  const { id } = parameters
  const { getBaseUrl } = config

  const res = await getRelayerWithAdmin(
    config,
    getBaseUrl(ADMIN_WALLET_MATCHABLE_ORDER_IDS_ROUTE(id)),
  )

  if (!res.order_ids) {
    throw new BaseError('No orders found')
  }

  return res.order_ids
}
