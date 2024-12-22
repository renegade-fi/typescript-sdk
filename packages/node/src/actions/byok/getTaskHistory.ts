import {
  type BYOKConfig,
  BaseError,
  TASK_HISTORY_ROUTE,
  type Task as TaskHistoryItem,
  getWithSymmetricKey,
} from '@renegade-fi/core'

export type GetTaskHistoryReturnType = Map<string, TaskHistoryItem>

export async function getTaskHistory(
  config: BYOKConfig,
): Promise<GetTaskHistoryReturnType> {
  const { getRelayerBaseUrl, symmetricKey, walletId } = config
  const res = await getWithSymmetricKey(config, {
    url: getRelayerBaseUrl(TASK_HISTORY_ROUTE(walletId)),
    key: symmetricKey,
  })
  if (!res.tasks) {
    throw new BaseError('No tasks found')
  }
  return new Map(res.tasks.map((task: TaskHistoryItem) => [task.id, task]))
}
