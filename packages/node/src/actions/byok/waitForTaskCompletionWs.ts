import type { WaitForTaskCompletionParameters } from '@renegade-fi/core'
import {
  AuthType,
  type BYOKConfig,
  TASK_STATUS_ROUTE,
  type WebsocketWaiterParams,
  websocketWaiter,
} from '@renegade-fi/core'
import { getTaskHistory } from './getTaskHistory.js'

export async function waitForTaskCompletionWs(
  config: BYOKConfig,
  parameters: WaitForTaskCompletionParameters,
): Promise<null | undefined> {
  const { id, timeout } = parameters
  const topic = TASK_STATUS_ROUTE(id)

  const wsWaiterParams: WebsocketWaiterParams = {
    config,
    topic,
    authType: AuthType.BYOK,
    messageHandler: (message: any) => {
      const parsedMessage = JSON.parse(message)
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
      const taskHistory = await getTaskHistory(config)
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
