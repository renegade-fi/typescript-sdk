export const ChainIds = {
    ArbitrumMainnet: 42161,
    ArbitrumSepolia: 421614,
} as const;
export type ChainId = (typeof ChainIds)[keyof typeof ChainIds];

export interface ChainConfig {
    readonly id: ChainId;
    readonly name: string;
    readonly hseBaseUrl: string;
    readonly darkpoolAddress: `0x${string}`;
    readonly permit2Address: `0x${string}`;
    readonly priceReporterUrl: string;
    readonly relayerUrl: string;
}

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
    [ChainIds.ArbitrumMainnet]: {
        id: ChainIds.ArbitrumMainnet,
        name: "Arbitrum Mainnet",
        hseBaseUrl: "https://mainnet.historical-state.renegade.fi:3000",
        darkpoolAddress: "0x30bD8eAb29181F790D7e495786d4B96d7AfDC518",
        permit2Address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        relayerUrl: "https://mainnet.cluster0.renegade.fi:3000",
        priceReporterUrl: "https://mainnet.price-reporter.renegade.fi:3000",
    },
    [ChainIds.ArbitrumSepolia]: {
        id: ChainIds.ArbitrumSepolia,
        name: "Arbitrum Sepolia",
        hseBaseUrl: "https://testnet.historical-state.renegade.fi:3000",
        darkpoolAddress: "0x9af58f1ff20ab22e819e40b57ffd784d115a9ef5",
        permit2Address: "0x9458198bcc289c42e460cb8ca143e5854f734442",
        relayerUrl: "https://testnet.cluster0.renegade.fi:3000",
        priceReporterUrl: "https://testnet.price-reporter.renegade.fi:3000",
    },
};

/** Returns true if the chain ID is supported */
export function isSupportedChainId(chainId: number): chainId is ChainId {
    return chainId in CHAIN_CONFIGS;
}

/** Get full config or throw if unsupported */
export function getChainConfig(chainId: number): ChainConfig {
    if (!isSupportedChainId(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return CHAIN_CONFIGS[chainId];
}

/** Quick HSE URL lookup */
export function getHseBaseUrl(chainId: number): string {
    return getChainConfig(chainId).hseBaseUrl;
}
