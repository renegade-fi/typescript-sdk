import { WITHDRAW_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type WithdrawRequestParameters = { request: string; mint: `0x${string}` }

export type WithdrawRequestReturnType = { taskId: string }

export type WithdrawRequestErrorType = BaseErrorType

export async function withdrawRequest(
  config: Config,
  parameters: WithdrawRequestParameters,
): Promise<WithdrawRequestReturnType> {
  const { mint, request } = parameters
  const { getRelayerBaseUrl } = config

  const walletId = getWalletId(config)

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
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
