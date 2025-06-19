import {
    AUTH_SERVER_URL_ARBITRUM_ONE,
    AUTH_SERVER_URL_ARBITRUM_SEPOLIA,
    AUTH_SERVER_URL_BASE_MAINNET,
    AUTH_SERVER_URL_BASE_SEPOLIA,
    CHAIN_ID_TO_ENVIRONMENT,
    CHAIN_IDS,
    CHAIN_SPECIFIERS,
    type ChainId,
    DARKPOOL_ADDRESS_ARBITRUM_ONE,
    DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
    DARKPOOL_ADDRESS_BASE_MAINNET,
    DARKPOOL_ADDRESS_BASE_SEPOLIA,
    ENV_AGNOSTIC_CHAINS,
    ENVIRONMENT,
    type EnvAgnosticChain,
    type Environment,
    HSE_URL_MAINNET,
    HSE_URL_TESTNET,
    PERMIT2_ADDRESS_ARBITRUM_ONE,
    PERMIT2_ADDRESS_ARBITRUM_SEPOLIA,
    PERMIT2_ADDRESS_BASE_MAINNET,
    PERMIT2_ADDRESS_BASE_SEPOLIA,
    PRICE_REPORTER_URL_MAINNET,
    PRICE_REPORTER_URL_TESTNET,
    RELAYER_URL_ARBITRUM_ONE,
    RELAYER_URL_ARBITRUM_SEPOLIA,
    RELAYER_URL_BASE_MAINNET,
    RELAYER_URL_BASE_SEPOLIA,
} from "../constants.js";

export interface SDKConfig {
    readonly id: ChainId;
    readonly chainSpecifier: string;
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
        chainSpecifier: CHAIN_SPECIFIERS[CHAIN_IDS.ArbitrumOne],
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
        chainSpecifier: CHAIN_SPECIFIERS[CHAIN_IDS.ArbitrumSepolia],
        hseBaseUrl: HSE_URL_TESTNET,
        darkpoolAddress: DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
        relayerUrl: RELAYER_URL_ARBITRUM_SEPOLIA,
        websocketUrl: `wss://${RELAYER_URL_ARBITRUM_SEPOLIA}:4000`,
        priceReporterUrl: PRICE_REPORTER_URL_TESTNET,
        permit2Address: PERMIT2_ADDRESS_ARBITRUM_SEPOLIA,
        authServerUrl: AUTH_SERVER_URL_ARBITRUM_SEPOLIA,
    },
    [CHAIN_IDS.BaseMainnet]: {
        id: CHAIN_IDS.BaseMainnet,
        chainSpecifier: CHAIN_SPECIFIERS[CHAIN_IDS.BaseMainnet],
        hseBaseUrl: HSE_URL_MAINNET,
        darkpoolAddress: DARKPOOL_ADDRESS_BASE_MAINNET,
        relayerUrl: RELAYER_URL_BASE_MAINNET,
        websocketUrl: `wss://${RELAYER_URL_BASE_MAINNET}:4000`,
        priceReporterUrl: PRICE_REPORTER_URL_MAINNET,
        permit2Address: PERMIT2_ADDRESS_BASE_MAINNET,
        authServerUrl: AUTH_SERVER_URL_BASE_MAINNET,
    },
    [CHAIN_IDS.BaseSepolia]: {
        id: CHAIN_IDS.BaseSepolia,
        chainSpecifier: CHAIN_SPECIFIERS[CHAIN_IDS.BaseSepolia],
        hseBaseUrl: HSE_URL_TESTNET,
        darkpoolAddress: DARKPOOL_ADDRESS_BASE_SEPOLIA,
        relayerUrl: RELAYER_URL_BASE_SEPOLIA,
        websocketUrl: `wss://${RELAYER_URL_BASE_SEPOLIA}:4000`,
        priceReporterUrl: PRICE_REPORTER_URL_TESTNET,
        permit2Address: PERMIT2_ADDRESS_BASE_SEPOLIA,
        authServerUrl: AUTH_SERVER_URL_BASE_SEPOLIA,
    },
};

/** Returns true if the chain ID is supported */
export function isSupportedChainId(chainId: number): chainId is ChainId {
    return chainId in CONFIGS;
}

/** Returns true if the environment is supported */
export function isSupportedEnvironment(env: string): env is Environment {
    return Object.values(ENVIRONMENT).includes(env as Environment);
}

/** Get full config or throw if unsupported */
export function getSDKConfig(chainId: number): SDKConfig {
    if (!isSupportedChainId(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return CONFIGS[chainId];
}

/** Get the environment for a given chain ID */
export function chainIdToEnv(chainId: number): Environment {
    if (!isSupportedChainId(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return CHAIN_ID_TO_ENVIRONMENT[chainId];
}

/** Get the chain ID for a given environment and chain name */
export function chainIdFromEnvAndName(env: Environment, name: EnvAgnosticChain): ChainId {
    switch (env) {
        case ENVIRONMENT.Mainnet:
            switch (name) {
                case ENV_AGNOSTIC_CHAINS.Arbitrum:
                    return CHAIN_IDS.ArbitrumOne;
                case ENV_AGNOSTIC_CHAINS.Base:
                    return CHAIN_IDS.BaseMainnet;
                default:
                    throw new Error(`Unsupported env / chain: ${env} / ${name}`);
            }

        case ENVIRONMENT.Testnet:
            switch (name) {
                case ENV_AGNOSTIC_CHAINS.Arbitrum:
                    return CHAIN_IDS.ArbitrumSepolia;
                case ENV_AGNOSTIC_CHAINS.Base:
                    return CHAIN_IDS.BaseSepolia;
                default:
                    throw new Error(`Unsupported env / chain: ${env} / ${name}`);
            }
    }
}

/** Get the env agnostic chain for a given chain ID */
export function getEnvAgnosticChain(chainId: ChainId): EnvAgnosticChain {
    switch (chainId) {
        case CHAIN_IDS.ArbitrumOne:
        case CHAIN_IDS.ArbitrumSepolia:
            return ENV_AGNOSTIC_CHAINS.Arbitrum;
        case CHAIN_IDS.BaseSepolia:
        case CHAIN_IDS.BaseMainnet:
            return ENV_AGNOSTIC_CHAINS.Base;
    }
}

/** Quick HSE URL lookup */
export function getHseBaseUrl(chainId: number): string {
    return getSDKConfig(chainId).hseBaseUrl;
}
