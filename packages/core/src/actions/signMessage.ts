import type { Hex } from 'viem'
import { getSkRoot } from './getSkRoot.js'

import type { Config } from '../createConfig.js'

export type SignMessageParameters = {
  message: string
}
export type SignMessageReturnType = Hex
export const signMessage = (
  config: Config,
  parameters: SignMessageParameters,
): SignMessageReturnType => {
  const { message } = parameters
  const { utils } = config
  return `0x${utils.sign_message(getSkRoot(config), message)}`
}
