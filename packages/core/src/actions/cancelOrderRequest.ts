import { CANCEL_ORDER_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type CancelOrderRequestParameters = { request: string; id: string }

export type CancelOrderRequestReturnType = { taskId: string }

export type CancelOrderRequestErrorType = BaseErrorType

export async function cancelOrderRequest(
  config: Config,
  parameters: CancelOrderRequestParameters,
): Promise<CancelOrderRequestReturnType> {
  const { request, id } = parameters
  const { getBaseUrl } = config

  const walletId = getWalletId(config)

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(CANCEL_ORDER_ROUTE(walletId, id)),
      request,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
