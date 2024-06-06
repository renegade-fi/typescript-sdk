////////////////////////////////////////////////////////////////////////////////
// createConfig
////////////////////////////////////////////////////////////////////////////////
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

export { type Config, type CreateConfigParameters } from '@renegade-fi/core'

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
  useFees,
  type UseFeesParameters,
  type UseFeesReturnType,
} from '../hooks/useFees.js'

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
  usePing,
  type UsePingParameters,
  type UsePingReturnType,
} from '../hooks/usePing.js'

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

////////////////////////////////////////////////////////////////////////////////
// @renegade/core
////////////////////////////////////////////////////////////////////////////////

// Types
export type {
  Balance,
  Exchange,
  NetworkOrder,
  Order,
  OrderMetadata,
  Task,
  TaskInfo,
  TaskState,
} from '@renegade-fi/core'

export {
  // Viem
  chain,
  // Utils
  formatAmount,
  parseAmount,
  // Types
  OrderState,
  TaskType,
  Token,
  UpdateType,
  // WebSocket
  WebSocketManager,
} from '@renegade-fi/core'
