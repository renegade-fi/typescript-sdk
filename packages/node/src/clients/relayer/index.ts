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

export class AdminRelayerClient {
    readonly config: Config;
    readonly configv2: SDKConfig;

    /**
     * @internal
     */
    private constructor(params: {
        apiKey: string;
        chainId: number;
    }) {
        const configv2 = getSDKConfig(params.chainId);
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
     * @param params.apiKey – the API key
     * @param params.chainId – the chain ID
     */
    static new({
        apiKey,
        chainId,
    }: {
        apiKey: string;
        chainId: number;
    }) {
        return new AdminRelayerClient({ apiKey, chainId });
    }

    /**
     * Assign an order to a matching pool
     *
     * @param params.orderId - the order ID
     * @param params.matchingPool - the matching pool address
     */
    async assignOrder(params: AssignOrderParameters) {
        return assignOrder(this.config, params);
    }

    /**
     * Create a matching pool
     *
     * @param params.matchingPool - the matching pool address
     */
    async createMatchingPool(params: CreateMatchingPoolParameters) {
        return createMatchingPool(this.config, params);
    }

    /**
     * Destroy a matching pool
     *
     * @param params.matchingPool - the matching pool address
     */
    async destroyMatchingPool(params: DestroyMatchingPoolParameters) {
        return destroyMatchingPool(this.config, params);
    }

    /**
     * Get open orders managed by the relayer
     *
     * @param params.matchingPool - the matching pool address
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
}
