import { createConfig } from "@renegade-fi/core";
import type { SDKConfig } from "@renegade-fi/core";
import {
    type CreateOrderInMatchingPoolParameters,
    createOrderInMatchingPool,
} from "@renegade-fi/core/actions";
import * as rustUtils from "../../../renegade-utils/index.js";
import { RenegadeClient } from "./base.js";
import type { ConstructorParams } from "./types.js";

/**
 * The client for interacting with the Renegade relayer's admin API, with a keychain.
 */
export class AdminRenegadeClient extends RenegadeClient {
    private readonly apiKey: string;

    /**
     * @internal
     */
    private constructor(params: ConstructorParams & { apiKey: string }) {
        const { apiKey, ...renegadeParams } = params;
        super(renegadeParams);
        this.apiKey = apiKey;
    }

    /**
     * Create an admin client for any chain by seed.
     *
     * @param params.chainId    the chain ID (e.g. CHAIN_IDS.ArbitrumMainnet)
     * @param params.seed       your 0x… seed
     * @param params.apiKey     your admin API key
     * @param params.overrides  optional overrides for SDK config values
     */
    static override new({
        chainId,
        seed,
        apiKey,
        overrides,
    }: {
        chainId: number;
        seed: `0x${string}`;
        apiKey: string;
        overrides?: Partial<SDKConfig>;
    }): AdminRenegadeClient {
        return new AdminRenegadeClient({ chainId, mode: "seed", seed, apiKey, overrides });
    }

    /**
     * @see AdminRelayerClient.new
     */
    static override newWithExternalKeychain: never;
    /**
     * @see AdminRelayerClient.new
     */
    static override newArbMainnetClient: never;
    /**
     * @see AdminRelayerClient.new
     */
    static override newArbMainnetClientWithKeychain: never;
    /**
     * @see AdminRelayerClient.new
     */
    static override newArbSepoliaClient: never;
    /**
     * @see AdminRelayerClient.new
     */
    static override newArbSepoliaClientWithKeychain: never;

    /**
     * Create an order in a matching pool
     *
     * @param params.matchingPool – the matching pool address
     */
    async createOrderInMatchingPool(params: CreateOrderInMatchingPoolParameters) {
        const config = createConfig({
            darkPoolAddress: this.configv2.darkpoolAddress,
            priceReporterUrl: this.configv2.priceReporterUrl,
            relayerUrl: this.configv2.relayerUrl,
            chainId: this.configv2.id,
            utils: rustUtils,
            // Inject the admin key
            adminKey: this.apiKey,
        });
        config.setState((s) => ({ ...s, seed: this.seed }));
        return createOrderInMatchingPool(config, params);
    }
}
