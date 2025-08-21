export * from "@renegade-fi/core";
export * from "@renegade-fi/core/actions";
export * from "@renegade-fi/core/constants";

import {
    createConfig as core_createConfig,
    createExternalKeyConfig as core_createExternalKeyConfig,
} from "@renegade-fi/core";

import * as RustUtils from "../../renegade-utils/index.js";

function createConfig(
    ...args: Parameters<typeof core_createConfig>
): ReturnType<typeof core_createConfig> {
    const config = core_createConfig({
        ...args[0],
        utils: RustUtils,
    });
    return config;
}

function createExternalKeyConfig(
    ...args: Parameters<typeof core_createExternalKeyConfig>
): ReturnType<typeof core_createExternalKeyConfig> {
    const config = core_createExternalKeyConfig({
        ...args[0],
        utils: RustUtils,
    });
    return config;
}

export { createConfig, createExternalKeyConfig };

////////////////////////////////////////////////////////////////////////////////
// Clients
////////////////////////////////////////////////////////////////////////////////

export { AdminRelayerClient } from "../clients/relayer/index.js";
export {
    AdminRenegadeClient,
    RenegadeClient,
} from "../clients/renegade/index.js";

////////////////////////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////////////////////////

export {
    type ExecuteDepositParameters,
    executeDeposit,
} from "../actions/executeDeposit.js";
export {
    type ExecuteWithdrawalParameters,
    executeWithdrawal,
} from "../actions/executeWithdrawal.js";
export {
    type GeneratedSecrets,
    generateWalletSecrets,
} from "../actions/generateWalletSecrets.js";

export { createOrderWebSocket } from "../services/orderWebSocket.js";

////////////////////////////////////////////////////////////////////////////////
// @renegade-fi/core
////////////////////////////////////////////////////////////////////////////////

export {
    // WebSocket
    AuthType,
    RelayerWebsocket,
    type RelayerWebsocketParams,
} from "@renegade-fi/core";
