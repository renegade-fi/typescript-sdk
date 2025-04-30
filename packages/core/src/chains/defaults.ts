import {
    CHAIN_IDS,
    type ChainId,
    DARKPOOL_ADDRESS_ARBITRUM_MAINNET,
    DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
    HSE_BASE_URL_ARBITRUM_MAINNET,
    HSE_BASE_URL_ARBITRUM_SEPOLIA,
    PRICE_REPORTER_URL_ARBITRUM_MAINNET,
    PRICE_REPORTER_URL_ARBITRUM_SEPOLIA,
    RELAYER_URL_ARBITRUM_MAINNET,
    RELAYER_URL_ARBITRUM_SEPOLIA,
} from "../constants.js";

export interface SDKConfig {
    readonly id: ChainId;
    readonly hseBaseUrl: string;
    readonly darkpoolAddress: `0x${string}`;
    readonly priceReporterUrl: string;
    readonly relayerUrl: string;
}

export const CONFIGS: Record<ChainId, SDKConfig> = {
    [CHAIN_IDS.ArbitrumMainnet]: {
        id: CHAIN_IDS.ArbitrumMainnet,
        hseBaseUrl: HSE_BASE_URL_ARBITRUM_MAINNET,
        darkpoolAddress: DARKPOOL_ADDRESS_ARBITRUM_MAINNET,
        relayerUrl: RELAYER_URL_ARBITRUM_MAINNET,
        priceReporterUrl: PRICE_REPORTER_URL_ARBITRUM_MAINNET,
    },
    [CHAIN_IDS.ArbitrumSepolia]: {
        id: CHAIN_IDS.ArbitrumSepolia,
        hseBaseUrl: HSE_BASE_URL_ARBITRUM_SEPOLIA,
        darkpoolAddress: DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
        relayerUrl: RELAYER_URL_ARBITRUM_SEPOLIA,
        priceReporterUrl: PRICE_REPORTER_URL_ARBITRUM_SEPOLIA,
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
