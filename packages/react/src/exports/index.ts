////////////////////////////////////////////////////////////////////////////////
// createConfig
////////////////////////////////////////////////////////////////////////////////
import {
  createAuthConfig as core_createAuthConfig,
  createConfig as core_createConfig,
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

export { createAuthConfig, createConfig }

////////////////////////////////////////////////////////////////////////////////
// Context
////////////////////////////////////////////////////////////////////////////////

export {
  RenegadeContext,
  RenegadeProvider,
  type RenegadeProviderProps,
} from '../context.js'

////////////////////////////////////////////////////////////////////////////////
// Hooks
////////////////////////////////////////////////////////////////////////////////

export {
  useBackOfQueueOrders,
  type UseBackOfQueueOrdersParameters,
  type UseBackOfQueueOrdersReturnType,
} from '../hooks/useBackOfQueueOrders.js'

export {
  useBackOfQueueBalances,
  type UseBackOfQueueBalancesParameters,
  type UseBackOfQueueBalancesReturnType,
} from '../hooks/useBackOfQueueBalances.js'

export {
  useBackOfQueueWallet,
  type UseBackOfQueueWalletParameters,
  type UseBackOfQueueWalletReturnType,
} from '../hooks/useBackOfQueueWallet.js'

export {
  useBalances,
  type UseBalancesParameters,
  type UseBalancesReturnType,
} from '../hooks/useBalances.js'

export {
  useConfig,
  type UseConfigParameters,
  type UseConfigReturnType,
} from '../hooks/useConfig.js'

export {
  useCancelOrder,
  type UseCancelOrderParameters,
  type UseCancelOrderReturnType,
} from '../hooks/useCancelOrder.js'

export {
  useCreateOrder,
  type UseCreateOrderParameters,
  type UseCreateOrderReturnType,
} from '../hooks/useCreateOrder.js'

export {
  useConnect,
  type UseConnectParameters,
  type UseConnectReturnType,
} from '../hooks/useConnect.js'

export {
  useDeposit,
  type UseDepositParameters,
  type UseDepositReturnType,
} from '../hooks/useDeposit.js'

export {
  useFees,
  type UseFeesParameters,
  type UseFeesReturnType,
} from '../hooks/useFees.js'

export {
  useInitialized,
  type UseInitializedParameters,
  type UseInitializedReturnType,
} from '../hooks/useInitialized.js'

export {
  useOpenOrders,
  type UseOpenOrdersParameters,
  type UseOpenOrdersReturnType,
} from '../hooks/useOpenOrders.js'

export {
  useOrderBookWebSocket,
  type UseOrderBookWebSocketParameters,
  type UseOrderBookWebSocketReturnType,
} from '../hooks/useOrderBookWebSocket.js'

export {
  useOrderHistory,
  type UseOrderHistoryParameters,
  type UseOrderHistoryReturnType,
} from '../hooks/useOrderHistory.js'

export {
  useOrderHistoryWebSocket,
  type UseOrderHistoryWebSocketParameters,
} from '../hooks/useOrderHistoryWebSocket.js'

export {
  useOrders,
  type UseOrdersParameters,
  type UseOrdersReturnType,
} from '../hooks/useOrders.js'

export {
  useOrderMetadata,
  type UseOrderMetadataParameters,
  type UseOrderMetadataReturnType,
} from '../hooks/useOrderMetadata.js'

export {
  usePayFees,
  type UsePayFeesParameters,
  type UsePayFeesReturnType,
} from '../hooks/usePayFees.js'

export {
  usePing,
  type UsePingParameters,
  type UsePingReturnType,
} from '../hooks/usePing.js'

export {
  usePkRootScalars,
  type UsePkRootParameters,
  type UsePkRootScalarsReturnType,
} from '../hooks/usePkRootScalars.js'

export {
  useNetworkOrders,
  type UseNetworkOrdersParameters,
  type UseNetworkOrdersReturnType,
} from '../hooks/useNetworkOrders.js'

export {
  useStatus,
  type UseStatusParameters,
  type UseStatusReturnType,
} from '../hooks/useStatus.js'

export {
  useTaskHistory,
  type UseTaskHistoryParameters,
  type UseTaskHistoryReturnType,
} from '../hooks/useTaskHistory.js'

export {
  useTaskHistoryWebSocket,
  type UseTaskHistoryWebSocketParameters,
} from '../hooks/useTaskHistoryWebSocket.js'

export {
  useWalletId,
  type UseWalletIdParameters,
  type UseWalletIdReturnType,
} from '../hooks/useWalletId.js'

export {
  useWalletWebsocket,
  type UseWalletParameters,
} from '../hooks/useWalletWebSocket.js'

export { useWallet } from '../hooks/useWallet.js'

export {
  useWithdraw,
  type UseWithdrawParameters,
  type UseWithdrawReturnType,
} from '../hooks/useWithdraw.js'

////////////////////////////////////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////////////////////////////////////

export { useQuery } from '../utils/query.js'

////////////////////////////////////////////////////////////////////////////////
// @renegade/core
////////////////////////////////////////////////////////////////////////////////

// Types
export type {
  Balance,
  Config,
  CreateConfigParameters,
  Exchange,
  NetworkOrder,
  Order,
  OrderMetadata,
  PartialOrderFill,
  Task,
  TaskInfo,
  TaskState,
} from '@renegade-fi/core'

export {
  // createStorage
  type CreateStorageParameters,
  type Storage,
  type StorageItemMap,
  createStorage,
  noopStorage,
  // Utils
  formatAmount,
  parseAmount,
  cookieStorage,
  cookieToInitialState,
  deepEqual,
  parseCookie,
  stringifyForWasm,
  // Types
  OrderState,
  TaskType,
  UpdateType,
  // WebSocket
  AuthType,
  RelayerWebsocket,
  type RelayerWebsocketParams,
  // Token
  Token,
  tokenMapping,
  loadTokenMapping,
  getDefaultQuoteToken,
} from '@renegade-fi/core'
