import { TASK_STATUS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { AuthType } from '../utils/websocket.js'
import {
  type WebsocketWaiterParams,
  websocketWaiter,
} from '../utils/websocketWaiter.js'
import {
  type GetTaskHistoryReturnType,
  getTaskHistory,
} from './getTaskHistory.js'
import type { WaitForTaskCompletionParameters } from './waitForTaskCompletion.js'

export async function waitForTaskCompletionWs(
  config: Config,
  parameters: WaitForTaskCompletionParameters,
): Promise<null | undefined> {
  const { id, timeout } = parameters
  const topic = TASK_STATUS_ROUTE(id)

  const wsWaiterParams: WebsocketWaiterParams = {
    config,
    topic,
    authType: AuthType.Wallet,
    messageHandler: (message: any) => {
      let parsedMessage: any
      try {
        parsedMessage = JSON.parse(message)
      } catch (error) {
        console.error('Error parsing websocket message: ', error, message)
        throw error
      }

      if (
        parsedMessage.topic === topic &&
        parsedMessage.event.type === 'TaskStatusUpdate'
      ) {
        if (parsedMessage.event.status?.state === 'Completed') {
          return null
        }

        if (parsedMessage.event.status?.state === 'Failed') {
          throw new Error(`Task ${id} failed`)
        }
      }

      return undefined
    },
    prefetch: async () => {
      let taskHistory: GetTaskHistoryReturnType
      try {
        taskHistory = await getTaskHistory(config)
      } catch (error) {
        console.error('Error pre-fetching task history: ', error)
        throw error
      }
      const task = taskHistory.get(id)

      if (task?.state === 'Completed') {
        return null
      }

      if (task?.state === 'Failed') {
        throw new Error(`Task ${id} failed`)
      }

      return undefined
    },
    timeout,
  }

  return websocketWaiter(wsWaiterParams)
}
