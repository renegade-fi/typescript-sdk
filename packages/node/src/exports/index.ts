export * from '@renegade-fi/core'
export * from '@renegade-fi/core/actions'
export * from '@renegade-fi/core/constants'

import {
  createAuthConfig as core_createAuthConfig,
  createConfig as core_createConfig,
} from '@renegade-fi/core'
import { createBYOKConfig as core_createBYOKConfig } from '../utils/createBYOKConfig.js'

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

function createBYOKConfig(
  ...args: Parameters<typeof core_createBYOKConfig>
): ReturnType<typeof core_createBYOKConfig> {
  const config = core_createBYOKConfig({
    ...args[0],
    utils: RustUtils,
  })
  return config
}

export { createAuthConfig, createConfig, createBYOKConfig }

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
export { deposit as byokDeposit } from '../actions/byok/deposit.js'
export {
  createWallet as byokCreateWallet,
  type CreateWalletParameters,
} from '../actions/byok/createWallet.js'
export {
  generateWalletSecrets,
  type GeneratedSecrets,
} from '../actions/byok/generateWalletSecrets.js'
export {
  getPkRootScalars as byokGetPkRootScalars,
  type GetPkRootParameters,
} from '../actions/byok/getPkRoot.js'
export {
  getBackOfQueueWallet as byokGetBackOfQueueWallet,
  type GetBackOfQueueWalletParameters,
} from '../actions/byok/getBackOfQueueWallet.js'
export {
  withdraw as byokWithdraw,
  type WithdrawParameters,
} from '../actions/byok/withdraw.js'

////////////////////////////////////////////////////////////////////////////////
// @renegade-fi/core
////////////////////////////////////////////////////////////////////////////////

export {
  // WebSocket
  AuthType,
  RelayerWebsocket,
  type RelayerWebsocketParams,
} from '@renegade-fi/core'
