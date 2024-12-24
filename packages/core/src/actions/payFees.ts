import { PAY_FEES_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import type { BaseError } from '../errors/base.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type PayFeesReturnType = { taskIds: string[] }

export type PayFeesErrorType = BaseError

export async function payFees(
  config: RenegadeConfig,
): Promise<PayFeesReturnType> {
  const { getBaseUrl } = config
  const walletId = getWalletId(config)

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(PAY_FEES_ROUTE(walletId)),
    )
    if (res?.task_ids) {
      res.task_ids.map((id: string) => {
        console.log(`task pay-fees(${id}): ${walletId}`)
      })
    }
    return { taskIds: res.task_ids }
  } catch (error) {
    console.error(`wallet id: ${walletId} pay fees failed`, {
      error,
    })
    throw error
  }
}
