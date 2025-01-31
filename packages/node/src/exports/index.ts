export * from '@renegade-fi/core'
export * from '@renegade-fi/core/actions'
export * from '@renegade-fi/core/constants'

import {
  createAuthConfig as core_createAuthConfig,
  createConfig as core_createConfig,
  createExternalKeyConfig as core_createExternalKeyConfig,
} from '@renegade-fi/core'

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

function createAuthConfig(
  ...args: Parameters<typeof core_createAuthConfig>
): ReturnType<typeof core_createAuthConfig> {
  const config = core_createAuthConfig({
    ...args[0],
    utils: RustUtils,
  })
  return config
}

function createExternalKeyConfig(
  ...args: Parameters<typeof core_createExternalKeyConfig>
): ReturnType<typeof core_createExternalKeyConfig> {
  const config = core_createExternalKeyConfig({
    ...args[0],
    utils: RustUtils,
  })
  return config
}

export { createAuthConfig, createConfig, createExternalKeyConfig }

////////////////////////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////////////////////////

export {
  executeDeposit,
  type ExecuteDepositParameters,
} from '../actions/executeDeposit.js'
export {
  executeWithdrawal,
  type ExecuteWithdrawalParameters,
} from '../actions/executeWithdrawal.js'
export {
  generateWalletSecrets,
  type GeneratedSecrets,
} from '../actions/generateWalletSecrets.js'

export { createOrderWebSocket } from '../services/orderWebSocket.js'

////////////////////////////////////////////////////////////////////////////////
// @renegade-fi/core
////////////////////////////////////////////////////////////////////////////////

export {
  // WebSocket
  AuthType,
  RelayerWebsocket,
  type RelayerWebsocketParams,
} from '@renegade-fi/core'
