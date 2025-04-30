import type { ChainId, RenegadeConfig } from "@renegade-fi/core";
import {
    CHAIN_IDS,
    DARKPOOL_ADDRESS_ARBITRUM_MAINNET,
    DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
    PRICE_REPORTER_URL_ARBITRUM_MAINNET,
    PRICE_REPORTER_URL_ARBITRUM_SEPOLIA,
    RELAYER_URL_ARBITRUM_MAINNET,
    RELAYER_URL_ARBITRUM_SEPOLIA,
    createConfig,
    getBackOfQueueWallet,
    getSDKConfig,
    getWalletFromRelayer,
    lookupWallet,
} from "@renegade-fi/core";
import * as rustUtils from "../../../renegade-utils/index.js";

type RustUtilsInterface = typeof rustUtils;

/**
 * A client for interacting with a Renegade relayer.
 *
 * Authentication is handled by providing a seed.
 * TODO: Provide docs on seed.
 */
export class RenegadeClient {
    readonly config: RenegadeConfig;

    constructor(
        baseUrl: string,
        rustUtils: RustUtilsInterface,
        seed: `0x${string}`,
        // TODO: In a future PR, refactor to remove below fields
        darkPoolAddress: `0x${string}`,
        priceReporterUrl: string,
        chainId: ChainId,
    ) {
        this.config = createConfig({
            darkPoolAddress: darkPoolAddress,
            priceReporterUrl: priceReporterUrl,
            relayerUrl: baseUrl,
            chainId: chainId,
            utils: rustUtils,
        });
        this.config.setState((s) => ({ ...s, seed }));
    }

    static new(chainId: ChainId, seed: `0x${string}`) {
        const config = getSDKConfig(chainId);
        return new RenegadeClient(
            config.relayerUrl,
            rustUtils,
            seed,
            config.darkpoolAddress,
            config.priceReporterUrl,
            chainId,
        );
    }

    static newArbitrumMainnetClient(seed: `0x${string}`) {
        return new RenegadeClient(
            RELAYER_URL_ARBITRUM_MAINNET,
            rustUtils,
            seed,
            DARKPOOL_ADDRESS_ARBITRUM_MAINNET,
            PRICE_REPORTER_URL_ARBITRUM_MAINNET,
            CHAIN_IDS.ArbitrumMainnet,
        );
    }

    static newArbitrumSepoliaClient(seed: `0x${string}`) {
        return new RenegadeClient(
            RELAYER_URL_ARBITRUM_SEPOLIA,
            rustUtils,
            seed,
            DARKPOOL_ADDRESS_ARBITRUM_SEPOLIA,
            PRICE_REPORTER_URL_ARBITRUM_SEPOLIA,
            CHAIN_IDS.ArbitrumSepolia,
        );
    }

    // -- Wallet Operations --
    async getWallet() {
        const wallet = await getWalletFromRelayer(this.getConfig());
        return wallet;
    }

    async getBackOfQueueWallet() {
        const wallet = await getBackOfQueueWallet(this.getConfig());
        return wallet;
    }

    async lookupWallet() {
        return lookupWallet(this.getConfig());
    }

    // -- Balance Operations --
    // TODO: Implement

    // -- Order Operations --
    // TODO: Implement

    // -- Private --
    private getConfig() {
        return this.config;
    }
}
