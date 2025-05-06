import { type Config, type SDKConfig, createConfig, getSDKConfig } from "@renegade-fi/core";
import type {
    AssignOrderParameters,
    CreateMatchingPoolParameters,
    DestroyMatchingPoolParameters,
    GetOpenOrdersParameters,
    GetOrderMatchingPoolParameters,
    GetOrderMetadataParameters,
    GetWalletMatchableOrderIdsParameters,
} from "@renegade-fi/core/actions";
import {
    assignOrder,
    createMatchingPool,
    destroyMatchingPool,
    getOpenOrders,
    getOrderMatchingPool,
    getOrderMetadata,
    getWalletMatchableOrderIds,
    triggerRelayerSnapshot,
} from "@renegade-fi/core/actions";
import * as rustUtils from "../../../renegade-utils/index.js";

/**
 * The client for interacting with the Renegade relayer's admin API with an API key.
 */
export class AdminRelayerClient {
    readonly config: Config;
    readonly configv2: SDKConfig;

    /**
     * @internal
     */
    private constructor(params: {
        apiKey: string;
        chainId: number;
        overrides?: Partial<SDKConfig>;
    }) {
        const defaultConfig = getSDKConfig(params.chainId);
        const configv2 = params.overrides
            ? { ...defaultConfig, ...params.overrides }
            : defaultConfig;
        this.configv2 = configv2;

        this.config = createConfig({
            adminKey: params.apiKey,
            darkPoolAddress: configv2.darkpoolAddress,
            priceReporterUrl: configv2.priceReporterUrl,
            relayerUrl: configv2.relayerUrl,
            chainId: configv2.id,
            utils: rustUtils,
        });
    }

    /**
     * Create a new AdminRelayerClient
     *
     * @param params.apiKey     your API key
     * @param params.chainId    the chain ID
     * @param params.overrides  any SDKConfig field can be passed directly as an override
     */
    static new({
        apiKey,
        chainId,
        overrides,
    }: {
        apiKey: string;
        chainId: number;
        overrides?: Partial<SDKConfig>;
    }) {
        return new AdminRelayerClient({ apiKey, chainId, overrides });
    }

    /**
     * Assign an order to a matching pool
     *
     * @param params.orderId        the order ID
     * @param params.matchingPool   name of the matching pool
     */
    async assignOrder(params: AssignOrderParameters) {
        return assignOrder(this.config, params);
    }

    /**
     * Create a matching pool
     *
     * @param params.matchingPool name of the matching pool
     */
    async createMatchingPool(params: CreateMatchingPoolParameters) {
        return createMatchingPool(this.config, params);
    }

    /**
     * Destroy a matching pool
     *
     * @param params.matchingPool name of the matching pool
     */
    async destroyMatchingPool(params: DestroyMatchingPoolParameters) {
        return destroyMatchingPool(this.config, params);
    }

    /**
     * Get open orders managed by the relayer
     */
    async getOpenOrders(params: GetOpenOrdersParameters) {
        return getOpenOrders(this.config, params);
    }

    /**
     * Get the matching pool for an order
     */
    async getOrderMatchingPool(params: GetOrderMatchingPoolParameters) {
        return getOrderMatchingPool(this.config, params);
    }

    /**
     * Get the metadata for an order
     */
    async getOrderMetadata(params: GetOrderMetadataParameters) {
        return getOrderMetadata(this.config, params);
    }

    /**
     * Get the matchable order IDs for a wallet
     */
    async getWalletMatchableOrderIds(params: GetWalletMatchableOrderIdsParameters) {
        return getWalletMatchableOrderIds(this.config, params);
    }

    /**
     * Trigger a relayer raft snapshot
     */
    async triggerSnapshot() {
        return triggerRelayerSnapshot(this.config);
    }

    /**
     * Get the config
     *
     * TODO: Remove once we migrate to the SDK config
     */
    public getConfig() {
        return this.config;
    }
}
