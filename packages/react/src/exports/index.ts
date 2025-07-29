////////////////////////////////////////////////////////////////////////////////
// createConfig
////////////////////////////////////////////////////////////////////////////////
import {
    createAuthConfig as core_createAuthConfig,
    createConfig as core_createConfig,
} from "@renegade-fi/core";

import * as RustUtils from "../../renegade-utils/index.js";

export { default as RustUtils } from "../../renegade-utils/index.js";

function createConfig(
    ...args: Parameters<typeof core_createConfig>
): ReturnType<typeof core_createConfig> {
    const config = core_createConfig({
        ...args[0],
        utils: RustUtils,
    });
    return config;
}

function createAuthConfig(
    ...args: Parameters<typeof core_createAuthConfig>
): ReturnType<typeof core_createAuthConfig> {
    const config = core_createAuthConfig({
        ...args[0],
        utils: RustUtils,
    });
    return config;
}

export { createAuthConfig, createConfig };

////////////////////////////////////////////////////////////////////////////////
// Context
////////////////////////////////////////////////////////////////////////////////

export {
    RenegadeContext,
    RenegadeProvider,
    type RenegadeProviderProps,
} from "../context.js";

////////////////////////////////////////////////////////////////////////////////
// Hooks
////////////////////////////////////////////////////////////////////////////////

export {
    type UseBackOfQueueBalancesParameters,
    type UseBackOfQueueBalancesReturnType,
    useBackOfQueueBalances,
} from "../hooks/useBackOfQueueBalances.js";
export {
    type UseBackOfQueueOrdersParameters,
    type UseBackOfQueueOrdersReturnType,
    useBackOfQueueOrders,
} from "../hooks/useBackOfQueueOrders.js";

export {
    type UseBackOfQueueWalletParameters,
    type UseBackOfQueueWalletReturnType,
    useBackOfQueueWallet,
} from "../hooks/useBackOfQueueWallet.js";

export {
    type UseBalancesParameters,
    type UseBalancesReturnType,
    useBalances,
} from "../hooks/useBalances.js";
export {
    type UseCancelOrderParameters,
    type UseCancelOrderReturnType,
    useCancelOrder,
} from "../hooks/useCancelOrder.js";
export {
    type UseConfigParameters,
    type UseConfigReturnType,
    useConfig,
} from "../hooks/useConfig.js";
export {
    type UseConnectParameters,
    type UseConnectReturnType,
    useConnect,
} from "../hooks/useConnect.js";
export {
    type UseCreateOrderParameters,
    type UseCreateOrderReturnType,
    useCreateOrder,
} from "../hooks/useCreateOrder.js";

export {
    type UseDepositParameters,
    type UseDepositReturnType,
    useDeposit,
} from "../hooks/useDeposit.js";

export {
    type UseFeesParameters,
    type UseFeesReturnType,
    useFees,
} from "../hooks/useFees.js";
export {
    type UseNetworkOrdersParameters,
    type UseNetworkOrdersReturnType,
    useNetworkOrders,
} from "../hooks/useNetworkOrders.js";
export {
    type UseOpenOrdersParameters,
    type UseOpenOrdersReturnType,
    useOpenOrders,
} from "../hooks/useOpenOrders.js";
export {
    type UseOrderBookWebSocketParameters,
    type UseOrderBookWebSocketReturnType,
    useOrderBookWebSocket,
} from "../hooks/useOrderBookWebSocket.js";
export {
    type UseOrderHistoryParameters,
    type UseOrderHistoryReturnType,
    useOrderHistory,
} from "../hooks/useOrderHistory.js";
export {
    type UseOrderHistoryWebSocketParameters,
    useOrderHistoryWebSocket,
} from "../hooks/useOrderHistoryWebSocket.js";

export {
    type UseOrderMetadataParameters,
    type UseOrderMetadataReturnType,
    useOrderMetadata,
} from "../hooks/useOrderMetadata.js";
export {
    type UseOrdersParameters,
    type UseOrdersReturnType,
    useOrders,
} from "../hooks/useOrders.js";
export {
    type UsePayFeesParameters,
    type UsePayFeesReturnType,
    usePayFees,
} from "../hooks/usePayFees.js";
export {
    type UsePingParameters,
    type UsePingReturnType,
    usePing,
} from "../hooks/usePing.js";
export {
    type UsePkRootParameters,
    type UsePkRootScalarsReturnType,
    usePkRootScalars,
} from "../hooks/usePkRootScalars.js";

export {
    type UseStatusParameters,
    type UseStatusReturnType,
    useStatus,
} from "../hooks/useStatus.js";

export {
    type UseTaskHistoryParameters,
    type UseTaskHistoryReturnType,
    useTaskHistory,
} from "../hooks/useTaskHistory.js";

export {
    type UseTaskHistoryWebSocketParameters,
    useTaskHistoryWebSocket,
} from "../hooks/useTaskHistoryWebSocket.js";
export { useWallet } from "../hooks/useWallet.js";
export {
    type UseWalletIdParameters,
    type UseWalletIdReturnType,
    useWalletId,
} from "../hooks/useWalletId.js";
export {
    type UseWalletParameters,
    useWalletWebsocket,
} from "../hooks/useWalletWebSocket.js";

export {
    type UseWithdrawParameters,
    type UseWithdrawReturnType,
    useWithdraw,
} from "../hooks/useWithdraw.js";

export { useWasmInitialized } from "../wasm.js";

////////////////////////////////////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////////////////////////////////////

export { useQuery } from "../utils/query.js";

export { createSignedWebSocketRequest } from "../utils/websocket.js";

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
} from "@renegade-fi/core";

export {
    // WebSocket
    AuthType,
    // Errors
    ConfigRequiredError,
    // createStorage
    type CreateStorageParameters,
    chainIdToEnv,
    // Utils
    cookieStorage,
    cookieToInitialState,
    createStorage,
    deepEqual,
    // Config
    getSDKConfig,
    isSupportedChainId,
    chainIdFromEnvAndName,
    noopStorage,
    // Types
    OrderState,
    parseCookie,
    RelayerWebsocket,
    type RelayerWebsocketParams,
    type Storage,
    type StorageItemMap,
    stringifyForWasm,
    TaskType,
    UpdateType,
} from "@renegade-fi/core";
