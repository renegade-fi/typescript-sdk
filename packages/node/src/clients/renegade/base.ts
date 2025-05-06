import type {
    CancelOrderParameters,
    CreateOrderParameters,
    DepositParameters,
    GetBackOfQueueWalletParameters,
    GetWalletFromRelayerParameters,
    RenegadeConfig,
    SDKConfig,
    UpdateOrderParameters,
    WithdrawParameters,
} from "@renegade-fi/core";
import {
    createConfig,
    createExternalKeyConfig,
    getSDKConfig,
    getTaskQueue,
    getWalletId,
    updateOrder,
} from "@renegade-fi/core";
import {
    cancelOrder,
    createOrder,
    createWallet,
    deposit,
    getBackOfQueueWallet,
    getTaskQueuePaused,
    getWalletFromRelayer,
    lookupWallet,
    payFees,
    refreshWallet,
    withdraw,
} from "@renegade-fi/core/actions";
import { CHAIN_IDS, ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/core/constants";
import type { PublicClient } from "viem";
import * as rustUtils from "../../../renegade-utils/index.js";
import { type ExecuteDepositParameters, executeDeposit } from "../../actions/executeDeposit.js";
import {
    type ExecuteWithdrawalParameters,
    executeWithdrawal,
} from "../../actions/executeWithdrawal.js";
import {
    type GeneratedSecrets,
    generateWalletSecrets,
} from "../../actions/generateWalletSecrets.js";
import type { ConstructorParams } from "./types.js";

/**
 * The client for interacting with the Renegade relayer with a keychain.
 */
export class RenegadeClient {
    readonly config: RenegadeConfig;
    readonly configv2: SDKConfig;
    readonly seed?: `0x${string}`;
    readonly walletSecrets?: GeneratedSecrets;

    /**
     * @internal
     */
    protected constructor(params: ConstructorParams) {
        const configv2 = getSDKConfig(params.chainId);
        this.configv2 = configv2;

        if (params.mode === "seed") {
            this.seed = params.seed;
            this.config = createConfig({
                darkPoolAddress: configv2.darkpoolAddress,
                priceReporterUrl: configv2.priceReporterUrl,
                relayerUrl: configv2.relayerUrl,
                chainId: configv2.id,
                utils: rustUtils,
            });
            this.config.setState((s) => ({ ...s, seed: params.seed }));
        } else {
            this.walletSecrets = params.walletSecrets;
            this.config = createExternalKeyConfig({
                chainId: configv2.id,
                darkPoolAddress: configv2.darkpoolAddress,
                relayerUrl: `https://${configv2.relayerUrl}:3000`,
                utils: rustUtils,
                websocketUrl: configv2.websocketUrl,
                signMessage: params.signMessage,
                symmetricKey: params.walletSecrets.symmetric_key,
                walletId: params.walletSecrets.wallet_id,
                publicKey: params.publicKey,
            });
        }
    }

    /**
     * Create a client for any chain by seed.
     *
     * @param params.chainId – the chain ID (e.g. CHAIN_IDS.ArbitrumMainnet)
     * @param params.seed    – your 0x… seed
     */
    static new({
        chainId,
        seed,
    }: {
        chainId: number;
        seed: `0x${string}`;
    }): RenegadeClient {
        return new RenegadeClient({ chainId, mode: "seed", seed });
    }

    /**
     * Create a client for any chain with an external keychain.
     *
     * @param params.chainId       – the chain ID
     * @param params.walletSecrets – symmetric key + wallet ID
     * @param params.signMessage   – callback to sign auth messages
     * @param params.publicKey     – your public key
     */
    static newWithExternalKeychain({
        chainId,
        walletSecrets,
        signMessage,
        publicKey,
    }: {
        chainId: number;
        walletSecrets: GeneratedSecrets;
        signMessage: (message: string) => Promise<`0x${string}`>;
        publicKey: `0x${string}`;
    }): RenegadeClient {
        return new RenegadeClient({
            chainId,
            mode: "keychain",
            walletSecrets,
            signMessage,
            publicKey,
        });
    }

    /**
     * Arbitrum Mainnet client via seed.
     *
     * @param params.seed – your 0x… seed
     */
    static newArbMainnetClient({
        seed,
    }: {
        seed: `0x${string}`;
    }) {
        return RenegadeClient.new({
            chainId: CHAIN_IDS.ArbitrumMainnet,
            seed,
        });
    }

    /**
     * Arbitrum Mainnet client with external keychain.
     *
     * @param params.walletSecrets – symmetric key + wallet ID
     * @param params.signMessage   – callback to sign auth messages
     * @param params.publicKey     – your public key
     */
    static newArbMainnetClientWithKeychain({
        walletSecrets,
        signMessage,
        publicKey,
    }: {
        walletSecrets: GeneratedSecrets;
        signMessage: (message: string) => Promise<`0x${string}`>;
        publicKey: `0x${string}`;
    }) {
        return RenegadeClient.newWithExternalKeychain({
            chainId: CHAIN_IDS.ArbitrumMainnet,
            walletSecrets,
            signMessage,
            publicKey,
        });
    }

    /**
     * Arbitrum Sepolia client via seed.
     *
     * @param params.seed – your 0x… seed
     */
    static newArbSepoliaClient({
        seed,
    }: {
        seed: `0x${string}`;
    }) {
        return RenegadeClient.new({
            chainId: CHAIN_IDS.ArbitrumSepolia,
            seed,
        });
    }

    /**
     * Arbitrum Sepolia client with external keychain.
     *
     * @param params.walletSecrets – symmetric key + wallet ID
     * @param params.signMessage   – callback to sign auth messages
     * @param params.publicKey     – your public key
     */
    static newArbSepoliaClientWithKeychain({
        walletSecrets,
        signMessage,
        publicKey,
    }: {
        walletSecrets: GeneratedSecrets;
        signMessage: (message: string) => Promise<`0x${string}`>;
        publicKey: `0x${string}`;
    }) {
        return RenegadeClient.newWithExternalKeychain({
            chainId: CHAIN_IDS.ArbitrumSepolia,
            walletSecrets,
            signMessage,
            publicKey,
        });
    }

    // -- Wallet Operations -- //

    async getWallet(
        params: GetWalletFromRelayerParameters = {
            filterDefaults: true,
        },
    ) {
        return getWalletFromRelayer(this.getConfig(), params);
    }

    async getBackOfQueueWallet(
        params: GetBackOfQueueWalletParameters = {
            filterDefaults: true,
        },
    ) {
        return getBackOfQueueWallet(this.getConfig(), params);
    }

    async lookupWallet() {
        if (this.walletSecrets) {
            return lookupWallet(this.getConfig(), {
                blinderSeed: this.walletSecrets.blinder_seed,
                shareSeed: this.walletSecrets.share_seed,
                skMatch: this.walletSecrets.sk_match,
            });
        }
        return lookupWallet(this.getConfig());
    }

    async refreshWallet() {
        return refreshWallet(this.getConfig());
    }

    async createWallet() {
        if (this.walletSecrets) {
            return createWallet(this.getConfig(), {
                blinderSeed: this.walletSecrets.blinder_seed,
                shareSeed: this.walletSecrets.share_seed,
                skMatch: this.walletSecrets.sk_match,
            });
        }
        return createWallet(this.getConfig());
    }

    getWalletId() {
        return getWalletId(this.getConfig());
    }

    // -- Balance Operations -- //

    async deposit(parameters: DepositParameters) {
        return deposit(this.getConfig(), parameters);
    }

    async executeDeposit(
        parameters: Omit<ExecuteDepositParameters, "permit2Address"> & {
            publicClient: PublicClient;
        },
    ) {
        let config: RenegadeConfig;
        if (this.config.renegadeKeyType === "internal") {
            config = createConfig({
                darkPoolAddress: this.configv2.darkpoolAddress,
                priceReporterUrl: this.configv2.priceReporterUrl,
                relayerUrl: this.configv2.relayerUrl,
                chainId: this.configv2.id,
                utils: rustUtils,
                viemClient: parameters.publicClient,
            });
            config.setState((s) => ({ ...s, seed: this.seed }));
        } else {
            config = createExternalKeyConfig({
                chainId: this.configv2.id,
                darkPoolAddress: this.configv2.darkpoolAddress,
                relayerUrl: `https://${this.configv2.relayerUrl}:3000`,
                utils: rustUtils,
                websocketUrl: this.configv2.websocketUrl,
                signMessage: this.config.signMessage,
                symmetricKey: this.config.symmetricKey,
                walletId: this.config.walletId,
                publicKey: this.config.publicKey,
                viemClient: parameters.publicClient,
            });
        }
        return executeDeposit(config, {
            ...parameters,
            permit2Address: this.configv2.permit2Address,
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

    // -- Order Operations -- //

    async placeOrder(parameters: CreateOrderParameters) {
        return createOrder(this.getConfig(), parameters);
    }

    async updateOrder(parameters: UpdateOrderParameters) {
        return updateOrder(this.getConfig(), parameters);
    }

    async cancelOrder(parameters: CancelOrderParameters) {
        return cancelOrder(this.getConfig(), parameters);
    }

    // -- Task Operations -- //

    async getTaskQueue() {
        return getTaskQueue(this.getConfig());
    }

    async getTaskQueuePaused() {
        return getTaskQueuePaused(this.getConfig());
    }

    // --- Keychain Generation --- //

    /**
     * Generate the message from which the seed can be derived.
     *
     * @param chainId - the chain ID
     * @returns the message to sign
     */
    static generateSeedMessage(chainId: number) {
        return `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`;
    }

    /**
     * Generate an externally managed keychain for a Renegade wallet.
     *
     * @param sign - the callback to sign messages
     * @returns the keychain
     */
    static async generateKeychain({
        sign,
    }: {
        sign: (message: string) => Promise<`0x${string}`>;
    }) {
        return generateWalletSecrets(sign);
    }

    // -- Private -- //

    /**
     * @internal
     */
    public getConfig() {
        return this.config;
    }
}
