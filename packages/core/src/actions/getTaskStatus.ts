import { getRelayerWithAuth } from '../utils/http.js'

import { GET_TASK_STATUS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { OldTask as Task } from '../types/wallet.js'

export type GetTaskStatusParameters = { id: string }

export type GetTaskStatusReturnType = Promise<Task>

export async function getTaskStatus(
  config: Config,
  parameters: GetTaskStatusParameters,
): GetTaskStatusReturnType {
  const { id } = parameters
  const { getRelayerBaseUrl } = config
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(GET_TASK_STATUS_ROUTE(id)),
  )
  return res.status
}
