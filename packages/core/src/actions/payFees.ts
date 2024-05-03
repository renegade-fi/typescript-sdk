import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { PAY_FEES_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'

export type PayFeesReturnType = Promise<{ taskIds: string[] }>

export async function payFees(config: Config): PayFeesReturnType {
  const { getRelayerBaseUrl } = config
  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const logContext = {
    walletId,
    wallet,
  }

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(PAY_FEES_ROUTE(walletId)),
    )
    if (res?.task_ids) {
      res.task_ids.map((id: string) => {
        console.log(`task pay-fees(${id}): ${walletId}`, logContext)
      })
    }
    return { taskIds: res.task_ids }
  } catch (error) {
    console.error(`wallet id: ${walletId} pay fees failed`, {
      error,
      ...logContext,
    })
    throw error
  }
}
