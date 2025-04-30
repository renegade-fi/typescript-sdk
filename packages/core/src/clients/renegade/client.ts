import { getBackOfQueueWallet } from "../../actions/getBackOfQueueWallet.js";
import { getWalletFromRelayer } from "../../actions/getWalletFromRelayer.js";
import { lookupWallet } from "../../actions/lookupWallet.js";
import { ChainIds, getChainConfig, type ChainConfig, type ChainId } from "../../chains/defaults.js";
import { createConfig, type RenegadeConfig } from "../../createConfig.js";

/**
 * A client for interacting with a Renegade relayer.
 *
 * Authentication is handled by providing a seed.
 * TODO: Provide docs on seed.
 */
export class RenegadeClient {
    readonly config: RenegadeConfig;

    constructor(cc: ChainConfig, seed: `0x${string}`) {
        this.config = createConfig({
            darkPoolAddress: cc.darkpoolAddress,
            priceReporterUrl: cc.priceReporterUrl,
            relayerUrl: cc.relayerUrl,
            chainId: cc.id,
        });
        this.config.setState((s) => ({ ...s, seed }));
    }

    static new(chainId: ChainId, seed: `0x${string}`): InstanceType<typeof this> {
        const cc = getChainConfig(chainId);
        return new RenegadeClient(cc, seed);
    }

    static newArbitrumMainnetClient(seed: `0x${string}`): InstanceType<typeof this> {
        const cc = getChainConfig(ChainIds.ArbitrumMainnet);
        return new RenegadeClient(cc, seed);
    }

    static newArbitrumSepoliaClient(seed: `0x${string}`): InstanceType<typeof this> {
        const cc = getChainConfig(ChainIds.ArbitrumSepolia);
        return new RenegadeClient(cc, seed);
    }

    // -- Public --
    getConfig() {
        return this.config;
    }

    // -- Wallet --
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
}
