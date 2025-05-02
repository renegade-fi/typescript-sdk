import type {
    CancelOrderParameters,
    CreateOrderParameters,
    DepositParameters,
    RenegadeConfig,
    SDKConfig,
    WithdrawParameters,
} from "@renegade-fi/core";
import { createConfig, getSDKConfig } from "@renegade-fi/core";
import {
    cancelOrder,
    createOrder,
    createWallet,
    deposit,
    getBackOfQueueWallet,
    getWalletFromRelayer,
    lookupWallet,
    payFees,
    refreshWallet,
    withdraw,
} from "@renegade-fi/core/actions";
import { CHAIN_IDS } from "@renegade-fi/core/constants";
import type { PublicClient, WalletClient } from "viem";
import * as rustUtils from "../../../renegade-utils/index.js";
import { type ExecuteDepositParameters, executeDeposit } from "../../actions/executeDeposit.js";
import {
    type ExecuteWithdrawalParameters,
    executeWithdrawal,
} from "../../actions/executeWithdrawal.js";

type RustUtilsInterface = typeof rustUtils;

/**
 * A client for interacting with a Renegade relayer.
 *
 * Authentication is handled by providing a seed.
 * TODO: Provide docs on seed.
 */
export class RenegadeClient {
    // TODO: Delete once we migrate to v2
    readonly config: RenegadeConfig;
    readonly configv2: SDKConfig;
    readonly seed: `0x${string}`;

    constructor(rustUtils: RustUtilsInterface, seed: `0x${string}`, configv2: SDKConfig) {
        this.seed = seed;
        this.config = createConfig({
            darkPoolAddress: configv2.darkpoolAddress,
            priceReporterUrl: configv2.priceReporterUrl,
            relayerUrl: configv2.relayerUrl,
            chainId: configv2.id,
            utils: rustUtils,
        });
        this.config.setState((s) => ({ ...s, seed }));
        this.configv2 = configv2;
    }

    static new(chainId: number, seed: `0x${string}`) {
        const config = getSDKConfig(chainId);
        return new RenegadeClient(rustUtils, seed, config);
    }

    static newArbitrumMainnetClient(seed: `0x${string}`) {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumMainnet);
        return new RenegadeClient(rustUtils, seed, config);
    }

    static newArbitrumSepoliaClient(seed: `0x${string}`) {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumSepolia);
        return new RenegadeClient(rustUtils, seed, config);
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

    async refreshWallet() {
        return refreshWallet(this.getConfig());
    }

    async createWallet() {
        return createWallet(this.getConfig());
    }

    // -- Balance Operations --
    async deposit(parameters: DepositParameters) {
        return deposit(this.getConfig(), parameters);
    }

    async executeDeposit(
        publicClient: PublicClient,
        walletClient: WalletClient,
        parameters: Omit<ExecuteDepositParameters, "permit2Address" | "walletClient">,
    ) {
        const config = getSDKConfig(this.getConfig().chainId);
        const configWithPublicClient = createConfig({
            darkPoolAddress: config.darkpoolAddress,
            priceReporterUrl: config.priceReporterUrl,
            relayerUrl: config.relayerUrl,
            chainId: this.getConfig().chainId,
            utils: rustUtils,
            viemClient: publicClient,
        });
        configWithPublicClient.setState((s) => ({ ...s, seed: this.seed }));
        return executeDeposit(configWithPublicClient, {
            ...parameters,
            permit2Address: this.configv2.permit2Address,
            walletClient,
        });
    }

    async withdraw(parameters: WithdrawParameters) {
        return withdraw(this.getConfig(), parameters);
    }

    async executeWithdraw(parameters: ExecuteWithdrawalParameters) {
        return executeWithdrawal(this.getConfig(), parameters);
    }

    async payFees() {
        return payFees(this.getConfig());
    }

    // -- Order Operations --
    async placeOrder(parameters: CreateOrderParameters) {
        return createOrder(this.getConfig(), parameters);
    }

    async cancelOrder(parameters: CancelOrderParameters) {
        return cancelOrder(this.getConfig(), parameters);
    }

    // -- Private --
    private getConfig() {
        return this.config;
    }
}
