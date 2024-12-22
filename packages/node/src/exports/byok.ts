import { createBYOKConfig as core_createBYOKConfig } from '../utils/createBYOKConfig.js'
import * as RustUtils from '../../renegade-utils/index.js'

////////////////////////////////////////////////////////////////////////////////
// Config
////////////////////////////////////////////////////////////////////////////////

function createBYOKConfig(
  ...args: Parameters<typeof core_createBYOKConfig>
): ReturnType<typeof core_createBYOKConfig> {
  const config = core_createBYOKConfig({
    ...args[0],
    utils: RustUtils,
  })
  return config
}

export { createBYOKConfig }

////////////////////////////////////////////////////////////////////////////////
// Actions (Bring Your Own Key)
////////////////////////////////////////////////////////////////////////////////

export {
  createWallet,
  type CreateWalletParameters,
  type CreateWalletReturnType,
} from '../actions/byok/createWallet.js'

export {
  generateWalletSecrets,
  type GeneratedSecrets,
} from '../actions/byok/generateWalletSecrets.js'

export {
  getPkRootScalars,
  type GetPkRootParameters,
  type GetPkRootScalarsReturnType,
} from '../actions/byok/getPkRoot.js'

export {
  getBackOfQueueWallet,
  type GetBackOfQueueWalletParameters,
  type GetBackOfQueueWalletReturnType,
} from '../actions/byok/getBackOfQueueWallet.js'

export {
  lookupWallet,
  type LookupWalletParameters,
  type LookupWalletReturnType,
} from '../actions/byok/lookupWallet.js'

export {
  deposit,
  type DepositParameters,
  type DepositReturnType,
} from '../actions/byok/deposit.js'

export {
  withdraw,
  type WithdrawParameters,
  type WithdrawReturnType,
} from '../actions/byok/withdraw.js'

export {
  payFees,
  type PayFeesReturnType,
} from '../actions/byok/payFees.js'

export {
  createOrder,
  type CreateOrderParameters,
  type CreateOrderReturnType,
} from '../actions/byok/createOrder.js'

export {
  cancelOrder,
  type CancelOrderParameters,
  type CancelOrderReturnType,
} from '../actions/byok/cancelOrder.js'

export {
  getOrderHistory,
  type GetOrderHistoryParameters,
  type GetOrderHistoryReturnType,
} from '../actions/byok/getOrderHistory.js'
