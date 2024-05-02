////////////////////////////////////////////////////////////////////////////////
// createConfig
////////////////////////////////////////////////////////////////////////////////
import { createConfig as core_createConfig } from "@renegade-fi/core"

import * as RustUtils from "../renegade-utils/index.js"

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

export { type Config, type CreateConfigParameters } from "@renegade-fi/core"

////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

export { PRICE_REPORTER_TOPIC, tokenMapping } from "@renegade-fi/core"

////////////////////////////////////////////////////////////////////////////////
// Context
////////////////////////////////////////////////////////////////////////////////

export { RenegadeContext, RenegadeProvider, type RenegadeProviderProps } from "./context.js"

////////////////////////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////////////////////////

export {
    cancelOrder,
    type CancelOrderParameters,
    type CancelOrderReturnType,
} from "@renegade-fi/core"

export { connect, type ConnectParameters, type ConnectReturnType } from "@renegade-fi/core"

export {
    createOrder,
    type CreateOrderParameters,
    type CreateOrderReturnType,
} from "@renegade-fi/core"

export {
    createWallet,
    type CreateWalletParameters,
    type CreateWalletReturnType,
} from "@renegade-fi/core"

export { deposit, type DepositParameters, type DepositReturnType } from "@renegade-fi/core"

export { disconnect, type DisconnectParameters, type DisconnectReturnType } from "@renegade-fi/core"

export {
    getPkRoot,
    getPkRootScalars,
    type GetPkRootReturnType,
    type GetPkRootScalarsReturnType,
} from "@renegade-fi/core"

export { getSkRoot, type GetSkRootParameters, type GetSkRootReturnType } from "@renegade-fi/core"

export {
    getWalletFromRelayer,
    type GetWalletFromRelayerParameters,
    type GetWalletFromRelayerReturnType,
} from "@renegade-fi/core"

export {
    lookupWallet,
    type LookupWalletParameters,
    type LookupWalletReturnType,
} from "@renegade-fi/core"

export { payFees, type PayFeesReturnType } from "@renegade-fi/core"

export {
    waitForTaskCompletion,
    type WaitForTaskCompletionParameters,
    type WaitForTaskCompletionReturnType,
} from "@renegade-fi/core"

export {
    watchStatus,
    type WatchStatusParameters,
    type WatchStatusReturnType,
} from "@renegade-fi/core"

export { withdraw, type WithdrawParameters, type WithdrawReturnType } from "@renegade-fi/core"

////////////////////////////////////////////////////////////////////////////////
// Hooks
////////////////////////////////////////////////////////////////////////////////

export {
    useBalances,
    type UseBalancesParameters,
    type UseBalancesReturnType,
} from "./hooks/useBalances.js"

export { useConfig, type UseConfigParameters, type UseConfigReturnType } from "./hooks/useConfig.js"

export { useFees, type UseFeesParameters, type UseFeesReturnType } from "./hooks/useFees.js"

export {
    useOrderBook,
    type UseOrderBookParameters,
    type UseOrderBookReturnType,
} from "./hooks/useOrderBook.js"

export {
    useOrderBookWebSocket,
    type UseOrderBookWebSocketParameters,
    type UseOrderBookWebSocketReturnType,
} from "./hooks/useOrderBookWebSocket.js"

export { useOrders, type UseOrdersParameters, type UseOrdersReturnType } from "./hooks/useOrders.js"

export { useOrder, type UseOrderParameters, type UseOrderReturnType } from "./hooks/useOrder.js"

export {
    useOrderHistory,
    type UseOrderHistoryParameters,
    type UseOrderHistoryReturnType,
} from "./hooks/useOrderHistory.js"

export {
    useOrderHistoryWebSocket,
    type UseOrderHistoryWebSocketParameters,
    type UseOrderHistoryWebSocketReturnType,
} from "./hooks/useOrderHistoryWebSocket.js"

export { useStatus, type UseStatusParameters, type UseStatusReturnType } from "./hooks/useStatus.js"

export {
    useTaskHistory,
    type UseTaskHistoryParameters,
    type UseTaskHistoryReturnType,
} from "./hooks/useTaskHistory.js"

export {
    useTaskHistoryWebSocket,
    type UseTaskHistoryWebSocketParameters,
    type UseTaskHistoryWebSocketReturnType,
} from "./hooks/useTaskHistoryWebSocket.js"

export {
    useTaskStatus,
    type UseTaskStatusParameters,
    type UseTaskStatusReturnType,
} from "./hooks/useTaskStatus.js"

export {
    useTaskQueue,
    type UseTaskQueueParameters,
    type UseTaskQueueReturnType,
} from "./hooks/useTaskQueue.js"

export { useWallet, type UseWalletParameters, type UseWalletReturnType } from "./hooks/useWallet.js"

export {
    useWalletId,
    type UseWalletIdParameters,
    type UseWalletIdReturnType,
} from "./hooks/useWalletId.js"

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export { Token } from "@renegade-fi/core"

export type {
    Balance,
    Exchange,
    NetworkOrder,
    Order,
    OrderMetadata,
    Task,
    TaskInfo,
    TaskState,
} from "@renegade-fi/core"

export { OrderState, TaskType, UpdateType } from "@renegade-fi/core"

////////////////////////////////////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////////////////////////////////////

export { WebSocketManager, formatAmount, parseAmount } from "@renegade-fi/core"

////////////////////////////////////////////////////////////////////////////////
// Viem
////////////////////////////////////////////////////////////////////////////////
export { chain } from "@renegade-fi/core"
