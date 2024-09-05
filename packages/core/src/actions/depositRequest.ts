import { DEPOSIT_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type DepositRequestParameters = { request: string }

export type DepositRequestReturnType = { taskId: string }

export type DepositRequestErrorType = BaseErrorType

export async function depositRequest(
  config: Config,
  parameters: DepositRequestParameters,
): Promise<DepositRequestReturnType> {
  const { request } = parameters
  const { getRelayerBaseUrl } = config

  const walletId = getWalletId(config)

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
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
