export * from '@renegade-fi/core'
export * from '@renegade-fi/core/actions'
export * from '@renegade-fi/core/constants'

import { createConfig as core_createConfig } from '@renegade-fi/core'

import * as RustUtils from '../../renegade-utils/index.js'

function createConfig(
  ...args: Parameters<typeof core_createConfig>
): ReturnType<typeof core_createConfig> {
  const config = core_createConfig({
    ...args[0],
    utils: RustUtils,
  })
  return config
}

export { createConfig }
