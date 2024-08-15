import axios from 'axios'
import type { Config } from '../createConfig.js'
import { getTaskStatus } from './getTaskStatus.js'
import type { WaitForTaskCompletionParameters } from './waitForTaskCompletion.js'
import type { RelayerWebsocketMessage } from '../types/ws.js'
import { TASK_STATUS_ROUTE } from '../constants.js'
import { websocketWaiter } from '../utils/websocketWaiter.js'

export async function waitForTaskCompletionWs(
  config: Config,
  parameters: WaitForTaskCompletionParameters,
): Promise<null | undefined> {
  const { id, timeout } = parameters

  const url = config.getWebsocketBaseUrl()
  const topic = TASK_STATUS_ROUTE(id)

  const prefetch = async () => {
    try {
      await getTaskStatus(config, { id })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // Assume a 404 means the task is completed
          return null
        }
      }
    }

    return undefined
  }

  const messageHandler = (message: RelayerWebsocketMessage) => {
    if (message.topic === topic && message.event.type === 'TaskStatusUpdate') {
      if (message.event.status?.state === 'Completed') {
        return null
      }

      if (message.event.status?.state === 'Failed') {
        throw new Error(`Task ${id} failed`)
      }
    }

    return undefined
  }

  return websocketWaiter(config, url, topic, messageHandler, prefetch, timeout)
}
