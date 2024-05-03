import { getWalletId } from './getWalletId.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { TASK_HISTORY_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Task as TaskHistoryItem } from '../types/task.js'

export type GetTaskHistoryReturnType = Promise<TaskHistoryItem[]>

export async function getTaskHistory(config: Config): GetTaskHistoryReturnType {
  const { getRelayerBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(TASK_HISTORY_ROUTE(walletId)),
  )
  return res.tasks
}
