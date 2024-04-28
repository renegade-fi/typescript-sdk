import { getWalletId } from "./getWalletId.js"

import { getRelayerWithAuth } from "../utils/http.js"

import { GET_TASK_QUEUE_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import type { Task } from "../types/wallet.js"

export type GetTaskQueueParameters = {}

export type GetTaskQueueReturnType = Promise<Task[]>

export async function getTaskQueue(
    config: Config,
    parameters: GetTaskQueueParameters = {},
): GetTaskQueueReturnType {
    const {} = parameters
    const { getRelayerBaseUrl } = config
    const walletId = getWalletId(config)
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_TASK_QUEUE_ROUTE(walletId)))
    return res.tasks
}
