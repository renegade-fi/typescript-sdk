import axios from 'axios'
import { getTaskStatus } from './getTaskStatus.js'

import type { Config } from '../createConfig.js'
import type { OldTask as Task } from '../types/wallet.js'

export type WaitForTaskCompletionParameters = { id: string, timeout?: number }

export type WaitForTaskCompletionReturnType = Promise<undefined>

export async function waitForTaskCompletion(
  config: Config,
  parameters: WaitForTaskCompletionParameters,
  onStateChange?: (task: Task) => void,
): WaitForTaskCompletionReturnType {
  const { pollingInterval } = config
  let lastState = ''

  while (true) {
    try {
      const response = await getTaskStatus(config, { id: parameters.id })
      const taskState = response.state
      onStateChange?.(response)
      if (taskState !== lastState) {
        lastState = taskState
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // Assume a 404 means the task is completed
          break
        }
      }
    }

    // Sleep for a bit before polling again
    await new Promise((resolve) => setTimeout(resolve, pollingInterval))
  }
}
