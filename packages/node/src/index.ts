export * from '@renegade-fi/core'
import { createConfig as core_createConfig } from '@renegade-fi/core'

import * as RustUtils from '../renegade-utils/index.js'

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
