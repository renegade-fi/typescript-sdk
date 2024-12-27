import { getWalletId } from './getWalletId.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { GET_TASK_QUEUE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { OldTask as Task } from '../types/wallet.js'

export type GetTaskQueueReturnType = Promise<Task[]>

export async function getTaskQueue(config: Config): GetTaskQueueReturnType {
  const { getBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getBaseUrl(GET_TASK_QUEUE_ROUTE(walletId)),
  )
  return res.tasks
}
