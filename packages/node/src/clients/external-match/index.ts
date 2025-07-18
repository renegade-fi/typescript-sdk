import type {
    AssembleExternalQuoteParameters,
    AssembleExternalQuoteReturnType,
    AssembleMalleableQuoteParameters,
    AssembleMalleableQuoteReturnType,
    AuthConfig,
    GetExternalMatchBundleParameters,
    GetExternalMatchBundleReturnType,
    GetExternalMatchQuoteParameters,
    GetExternalMatchQuoteReturnType,
    GetSupportedTokensReturnType,
    GetTokenPricesReturnType,
    RenegadeConfig,
    SDKConfig,
} from "@renegade-fi/core";
import {
    assembleExternalQuote,
    assembleMalleableQuote,
    createAuthConfig,
    createConfig,
    getExternalMatchBundle,
    getExternalMatchQuote,
    getSDKConfig,
    getSupportedTokens,
    getTokenPrices,
} from "@renegade-fi/core";
import { CHAIN_IDS } from "@renegade-fi/core/constants";
import * as rustUtils from "../../../renegade-utils/index.js";

type RustUtilsInterface = typeof rustUtils;

/**
 * A client for interacting with a Renegade relayer.
 *
 * Authentication is handled by providing an API key and secret.
 */
export class ExternalMatchClient {
    // TODO: Delete once we migrate to v2
    readonly config: AuthConfig;
    readonly relayerConfig: RenegadeConfig;
    readonly configv2: SDKConfig;
    readonly apiKey: string;
    readonly apiSecret: string;

    /**
     * @internal
     */
    private constructor(params: {
        rustUtils: RustUtilsInterface;
        chainId: number;
        apiKey: string;
        apiSecret: string;
        overrides?: Partial<SDKConfig>;
    }) {
        const defaultConfig = getSDKConfig(params.chainId);
        const configv2 = params.overrides
            ? { ...defaultConfig, ...params.overrides }
            : defaultConfig;
        this.relayerConfig = createConfig({
            darkPoolAddress: configv2.darkpoolAddress,
            priceReporterUrl: configv2.priceReporterUrl,
            relayerUrl: configv2.relayerUrl,
            chainId: configv2.id,
            utils: rustUtils,
        });
        this.configv2 = configv2;
        this.apiKey = params.apiKey;
        this.apiSecret = params.apiSecret;

        this.config = createAuthConfig({
            apiKey: params.apiKey,
            apiSecret: params.apiSecret,
            authServerUrl: configv2.authServerUrl,
            utils: rustUtils,
        });
    }

    /**
     * Create a new ExternalMatchClient for a given chain.
     *
     * @param params.apiKey    your API key
     * @param params.apiSecret your API secret
     * @param params.chainId   the chain ID
     * @param params.overrides any SDKConfig field can be passed directly as an override
     */
    static new({
        apiKey,
        apiSecret,
        chainId,
        overrides,
    }: {
        apiKey: string;
        apiSecret: string;
        chainId: number;
        overrides?: Partial<SDKConfig>;
    }) {
        return new ExternalMatchClient({
            rustUtils,
            chainId,
            apiKey,
            apiSecret,
            overrides,
        });
    }

    /**
     * Create a new ExternalMatchClient for Arbitrum One.
     *
     * @param params.apiKey    your API key
     * @param params.apiSecret your API secret
     */
    static newArbitrumOneClient({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) {
        return new ExternalMatchClient({
            rustUtils,
            chainId: CHAIN_IDS.ArbitrumOne,
            apiKey,
            apiSecret,
        });
    }

    /**
     * Create a new ExternalMatchClient for Arbitrum Sepolia.
     *
     * @param params.apiKey    your API key
     * @param params.apiSecret your API secret
     */
    static newArbitrumSepoliaClient({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) {
        return new ExternalMatchClient({
            rustUtils,
            chainId: CHAIN_IDS.ArbitrumSepolia,
            apiKey,
            apiSecret,
        });
    }

    /**
     * Create a new ExternalMatchClient for Base Mainnet.
     *
     * @param params.apiKey    your API key
     * @param params.apiSecret your API secret
     */
    static newBaseMainnetClient({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) {
        return new ExternalMatchClient({
            rustUtils,
            chainId: CHAIN_IDS.BaseMainnet,
            apiKey,
            apiSecret,
        });
    }

    /**
     * Create a new ExternalMatchClient for Base Sepolia.
     *
     * @param params.apiKey    your API key
     * @param params.apiSecret your API secret
     */
    static newBaseSepoliaClient({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) {
        return new ExternalMatchClient({
            rustUtils,
            chainId: CHAIN_IDS.BaseSepolia,
            apiKey,
            apiSecret,
        });
    }

    // -- Direct Match -- //

    /**
     * @deprecated use ExternalMatchClient.getQuote and ExternalMatchClient.assembleQuote instead
     */
    async getExternalMatch(
        params: GetExternalMatchBundleParameters,
    ): Promise<GetExternalMatchBundleReturnType> {
        return getExternalMatchBundle(this.getConfig(), params);
    }

    // -- Quote + Assmeble //

    /**
     * Get a quote for an external match
     */
    async getQuote(
        params: GetExternalMatchQuoteParameters,
    ): Promise<GetExternalMatchQuoteReturnType> {
        return getExternalMatchQuote(this.getConfig(), params);
    }

    /**
     * Assemble a quote into a match bundle, ready for settlement
     */
    async assembleQuote(
        params: AssembleExternalQuoteParameters,
    ): Promise<AssembleExternalQuoteReturnType> {
        return assembleExternalQuote(this.getConfig(), params);
    }

    /**
     * Assemble a quote into a malleable match bundle, ready for settlement
     */
    async assembleMalleableQuote(
        params: AssembleMalleableQuoteParameters,
    ): Promise<AssembleMalleableQuoteReturnType> {
        return assembleMalleableQuote(this.getConfig(), params);
    }

    // -- Token -- //

    /**
     * Get the list of supported tokens
     */
    async getSupportedTokens(): Promise<GetSupportedTokensReturnType> {
        return getSupportedTokens(this.getConfig());
    }

    /**
     * Get the token prices for all supported tokens
     */
    async getTokenPrices(): Promise<GetTokenPricesReturnType> {
        return getTokenPrices(this.getConfig());
    }

    // -- Private --

    /**
     * Get the config for the auth server
     */
    protected getConfig() {
        return this.config;
    }

    /**
     * Get the config for the relayer
     */
    protected getRelayerConfig() {
        return this.relayerConfig;
    }
}
