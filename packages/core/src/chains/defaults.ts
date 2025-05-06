import {
    AUTH_SERVER_URL_ARBITRUM_ONE,
    AUTH_SERVER_URL_ARBITRUM_SEPOLIA,
    CHAIN_IDS,
    type ChainId,
    DARKPOOL_ADDRESS_ARBITRUM_ONE,
    DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
    HSE_URL_MAINNET,
    HSE_URL_TESTNET,
    PERMIT2_ADDRESS_ARBITRUM_ONE,
    PERMIT2_ADDRESS_ARBITRUM_SEPOLIA,
    PRICE_REPORTER_URL_MAINNET,
    PRICE_REPORTER_URL_TESTNET,
    RELAYER_URL_ARBITRUM_ONE,
    RELAYER_URL_ARBITRUM_SEPOLIA,
} from "../constants.js";

export interface SDKConfig {
    readonly id: ChainId;
    readonly environment: string;
    readonly hseBaseUrl: string;
    readonly darkpoolAddress: `0x${string}`;
    readonly priceReporterUrl: string;
    readonly relayerUrl: string;
    readonly websocketUrl: string;
    readonly permit2Address: `0x${string}`;
    readonly authServerUrl: string;
}

export const CONFIGS: Record<ChainId, SDKConfig> = {
    [CHAIN_IDS.ArbitrumOne]: {
        id: CHAIN_IDS.ArbitrumOne,
        environment: "mainnet",
        hseBaseUrl: HSE_URL_MAINNET,
        darkpoolAddress: DARKPOOL_ADDRESS_ARBITRUM_ONE,
        relayerUrl: RELAYER_URL_ARBITRUM_ONE,
        websocketUrl: `wss://${RELAYER_URL_ARBITRUM_ONE}:4000`,
        priceReporterUrl: PRICE_REPORTER_URL_MAINNET,
        permit2Address: PERMIT2_ADDRESS_ARBITRUM_ONE,
        authServerUrl: AUTH_SERVER_URL_ARBITRUM_ONE,
    },
    [CHAIN_IDS.ArbitrumSepolia]: {
        id: CHAIN_IDS.ArbitrumSepolia,
        environment: "testnet",
        hseBaseUrl: HSE_URL_TESTNET,
        darkpoolAddress: DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
        relayerUrl: RELAYER_URL_ARBITRUM_SEPOLIA,
        websocketUrl: `wss://${RELAYER_URL_ARBITRUM_SEPOLIA}:4000`,
        priceReporterUrl: PRICE_REPORTER_URL_TESTNET,
        permit2Address: PERMIT2_ADDRESS_ARBITRUM_SEPOLIA,
        authServerUrl: AUTH_SERVER_URL_ARBITRUM_SEPOLIA,
    },
};

/** Returns true if the chain ID is supported */
export function isSupportedChainId(chainId: number): chainId is ChainId {
    return chainId in CONFIGS;
}

/** Get full config or throw if unsupported */
export function getSDKConfig(chainId: number): SDKConfig {
    if (!isSupportedChainId(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return CONFIGS[chainId];
}

/** Quick HSE URL lookup */
export function getHseBaseUrl(chainId: number): string {
    return getSDKConfig(chainId).hseBaseUrl;
}
