import { PAY_FEES_ROUTE, postWithSymmetricKey } from '@renegade-fi/core'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'

export type PayFeesReturnType = Promise<{ taskIds: string[] }>

export async function payFees(config: BYOKConfig): PayFeesReturnType {
  const { symmetricKey, walletId, getRelayerBaseUrl } = config

  try {
    const res = await postWithSymmetricKey(config, {
      body: '',
      key: symmetricKey,
      url: getRelayerBaseUrl(PAY_FEES_ROUTE(walletId)),
    })
    if (res?.task_ids) {
      res.task_ids.map((id: string) => {
        console.log(`task pay-fees(${id}): ${walletId}`)
      })
    }
    return { taskIds: res.task_ids }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
