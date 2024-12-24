import { getWalletId } from './getWalletId.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { TASK_HISTORY_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type { Task as TaskHistoryItem } from '../types/task.js'

export type GetTaskHistoryReturnType = Map<string, TaskHistoryItem>

export type GetTaskHistoryErrorType = BaseErrorType

export async function getTaskHistory(
  config: RenegadeConfig,
): Promise<GetTaskHistoryReturnType> {
  const { getBaseUrl } = config
  const walletId = getWalletId(config)
  const res = await getRelayerWithAuth(
    config,
    getBaseUrl(TASK_HISTORY_ROUTE(walletId)),
  )
  if (!res.tasks) {
    throw new BaseError('No tasks found')
  }
  return new Map(res.tasks.map((task: TaskHistoryItem) => [task.id, task]))
}
