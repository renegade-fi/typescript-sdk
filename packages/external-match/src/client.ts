/**
 * Client for interacting with the Renegade external matching API.
 *
 * This client handles authentication and provides methods for requesting quotes,
 * assembling matches, and executing trades.
 */

import { type HttpResponse, RelayerHttpClient } from "./http.js";
import {
    ExchangeMetadataResponse,
    type ExternalMatchResponse,
    type ExternalOrder,
    type GetDepthForAllPairsResponse,
    MalleableExternalMatchResponse,
    type OrderBookDepth,
    type SignedExternalQuote,
    type SupportedTokensResponse,
    type TokenPricesResponse,
} from "./types/index.js";
import type {
    AssembleExternalMatchRequestV2,
    ExternalOrderV2,
    GetMarketDepthByMintResponse,
    GetMarketDepthsResponse,
    GetMarketsResponse,
} from "./types/v2Types.js";
import {
    deserializeMarketDepthResponse,
    deserializeMarketDepthsResponse,
    deserializeMarketsResponse,
    deserializeMatchResponseV2,
    deserializeQuoteResponseV2,
    serializeAssembleRequestV2,
    serializeQuoteRequestV2,
} from "./types/v2Types.js";
import {
    marketDepthsToV1,
    marketDepthToV1,
    marketsToSupportedTokens,
    marketsToTokenPrices,
    v1OrderToV2,
    v1QuoteToV2,
    v2QuoteToV1,
    v2ResponseToV1NonMalleable,
} from "./v1Conversions.js";
import { VERSION } from "./version.js";

// Constants for auth server URLs
const ARBITRUM_SEPOLIA_BASE_URL = "https://arbitrum-sepolia.v2.auth-server.renegade.fi";
const ARBITRUM_ONE_BASE_URL = "https://arbitrum-one.v2.auth-server.renegade.fi";
const BASE_SEPOLIA_BASE_URL = "https://base-sepolia.v2.auth-server.renegade.fi";
const BASE_MAINNET_BASE_URL = "https://base-mainnet.v2.auth-server.renegade.fi";

// Constants for relayer URLs
const ARBITRUM_SEPOLIA_RELAYER_URL = "https://arbitrum-sepolia.v2.relayer.renegade.fi";
const ARBITRUM_ONE_RELAYER_URL = "https://arbitrum-one.v2.relayer.renegade.fi";
const BASE_SEPOLIA_RELAYER_URL = "https://base-sepolia.v2.relayer.renegade.fi";
const BASE_MAINNET_RELAYER_URL = "https://base-mainnet.v2.relayer.renegade.fi";

// Header constants
const RENEGADE_API_KEY_HEADER = "x-renegade-api-key";
const RENEGADE_SDK_VERSION_HEADER = "x-renegade-sdk-version";

// V2 API Routes
const GET_QUOTE_ROUTE = "/v2/external-matches/get-quote";
const ASSEMBLE_MATCH_BUNDLE_ROUTE = "/v2/external-matches/assemble-match-bundle";
const GET_MARKETS_ROUTE = "/v2/markets";
const GET_MARKET_DEPTH_BY_MINT_ROUTE = "/v2/markets"; // /{mint}/depth appended dynamically
const GET_MARKETS_DEPTH_ROUTE = "/v2/markets/depth";
const GET_EXCHANGE_METADATA_ROUTE = "/v2/metadata/exchange";

// Query Parameters
const DISABLE_GAS_SPONSORSHIP_QUERY_PARAM = "disable_gas_sponsorship";
const GAS_REFUND_ADDRESS_QUERY_PARAM = "refund_address";
const REFUND_NATIVE_ETH_QUERY_PARAM = "refund_native_eth";

/**
 * Get the SDK version string.
 */
function getSdkVersion(): string {
    return `typescript-v${VERSION}`;
}

/**
 * Options for requesting a quote.
 */
export class RequestQuoteOptions {
    disableGasSponsorship = false;
    gasRefundAddress?: string;
    refundNativeEth = false;

    static new(): RequestQuoteOptions {
        return new RequestQuoteOptions();
    }

    withGasSponsorshipDisabled(disableGasSponsorship: boolean): this {
        this.disableGasSponsorship = disableGasSponsorship;
        return this;
    }

    withGasRefundAddress(gasRefundAddress: string): this {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    withRefundNativeEth(refundNativeEth: boolean): this {
        this.refundNativeEth = refundNativeEth;
        return this;
    }

    buildRequestPath(): string {
        const params = new URLSearchParams();
        params.set(DISABLE_GAS_SPONSORSHIP_QUERY_PARAM, this.disableGasSponsorship.toString());
        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        if (this.refundNativeEth) {
            params.set(REFUND_NATIVE_ETH_QUERY_PARAM, this.refundNativeEth.toString());
        }

        return `${GET_QUOTE_ROUTE}?${params.toString()}`;
    }
}

/**
 * Options for requesting an external match directly.
 */
export class RequestExternalMatchOptions {
    disableGasSponsorship = false;
    gasRefundAddress?: string;
    refundNativeEth = false;
    doGasEstimation = false;
    receiverAddress?: string;

    static new(): RequestExternalMatchOptions {
        return new RequestExternalMatchOptions();
    }

    withGasSponsorshipDisabled(disableGasSponsorship: boolean): this {
        this.disableGasSponsorship = disableGasSponsorship;
        return this;
    }

    withGasRefundAddress(gasRefundAddress: string): this {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    withRefundNativeEth(refundNativeEth: boolean): this {
        this.refundNativeEth = refundNativeEth;
        return this;
    }

    withGasEstimation(doGasEstimation: boolean): this {
        this.doGasEstimation = doGasEstimation;
        return this;
    }

    withReceiverAddress(receiverAddress: string): this {
        this.receiverAddress = receiverAddress;
        return this;
    }

    buildRequestPath(): string {
        const params = new URLSearchParams();
        params.set(DISABLE_GAS_SPONSORSHIP_QUERY_PARAM, this.disableGasSponsorship.toString());
        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        if (this.refundNativeEth) {
            params.set(REFUND_NATIVE_ETH_QUERY_PARAM, this.refundNativeEth.toString());
        }

        const query = params.toString();
        return query.length > 0
            ? `${ASSEMBLE_MATCH_BUNDLE_ROUTE}?${query}`
            : ASSEMBLE_MATCH_BUNDLE_ROUTE;
    }
}

/**
 * Options for assembling an external match.
 */
export class AssembleExternalMatchOptions {
    doGasEstimation = false;
    receiverAddress?: string;
    updatedOrder?: ExternalOrder;

    static new(): AssembleExternalMatchOptions {
        return new AssembleExternalMatchOptions();
    }

    withGasEstimation(doGasEstimation: boolean): AssembleExternalMatchOptions {
        this.doGasEstimation = doGasEstimation;
        return this;
    }

    withReceiverAddress(receiverAddress: string): AssembleExternalMatchOptions {
        this.receiverAddress = receiverAddress;
        return this;
    }

    withUpdatedOrder(updatedOrder: ExternalOrder): AssembleExternalMatchOptions {
        this.updatedOrder = updatedOrder;
        return this;
    }

    buildRequestPath(): string {
        return ASSEMBLE_MATCH_BUNDLE_ROUTE;
    }
}

/**
 * Options for assembling a malleable external match.
 */
export class AssembleMalleableExternalMatchOptions extends AssembleExternalMatchOptions {
    static override new(): AssembleMalleableExternalMatchOptions {
        return new AssembleMalleableExternalMatchOptions();
    }
}

/**
 * Validate that an external order has the required fields and exactly one sizing field set.
 */
function validateExternalOrder(order: ExternalOrder): void {
    if (!order.base_mint) {
        throw new ExternalMatchClientError("base_mint must be set");
    }
    if (!order.quote_mint) {
        throw new ExternalMatchClientError("quote_mint must be set");
    }
    if (!order.side) {
        throw new ExternalMatchClientError("side must be set");
    }

    const sizingFields = [
        order.base_amount,
        order.quote_amount,
        order.exact_base_output,
        order.exact_quote_output,
    ];
    const numSet = sizingFields.filter((f) => f !== undefined && f !== BigInt(0)).length;

    if (numSet === 0) {
        throw new ExternalMatchClientError(
            "exactly one of base_amount, quote_amount, exact_base_output, or exact_quote_output must be set",
        );
    }
    if (numSet > 1) {
        throw new ExternalMatchClientError(
            "exactly one of base_amount, quote_amount, exact_base_output, or exact_quote_output must be set",
        );
    }
}

/**
 * Error thrown by the ExternalMatchClient.
 */
export class ExternalMatchClientError extends Error {
    statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = "ExternalMatchClientError";
        this.statusCode = statusCode;
    }
}

/**
 * Build a v2 assemble request for a direct order.
 */
function buildDirectOrderRequest(
    v2Order: ExternalOrderV2,
    options: { doGasEstimation: boolean; receiverAddress?: string },
): AssembleExternalMatchRequestV2 {
    return {
        do_gas_estimation: options.doGasEstimation,
        receiver_address: options.receiverAddress,
        order: {
            type: "direct-order",
            external_order: v2Order,
        },
    };
}

/**
 * Client for interacting with the Renegade external matching API.
 */
export class ExternalMatchClient {
    private apiKey: string;
    private httpClient: RelayerHttpClient;
    private relayerHttpClient?: RelayerHttpClient;

    /**
     * Initialize a new ExternalMatchClient.
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @param baseUrl The base URL of the auth server API
     * @param relayerBaseUrl The base URL of the relayer API (for market endpoints)
     */
    constructor(apiKey: string, apiSecret: string, baseUrl: string, relayerBaseUrl?: string) {
        this.apiKey = apiKey;
        this.httpClient = new RelayerHttpClient(baseUrl, apiSecret);
        if (relayerBaseUrl) {
            this.relayerHttpClient = new RelayerHttpClient(relayerBaseUrl, apiSecret);
        }
    }

    /**
     * Create a new client configured for the Arbitrum Sepolia testnet.
     */
    static newArbitrumSepoliaClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(
            apiKey,
            apiSecret,
            ARBITRUM_SEPOLIA_BASE_URL,
            ARBITRUM_SEPOLIA_RELAYER_URL,
        );
    }

    /**
     * Create a new client configured for the Base Sepolia testnet.
     */
    static newBaseSepoliaClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(
            apiKey,
            apiSecret,
            BASE_SEPOLIA_BASE_URL,
            BASE_SEPOLIA_RELAYER_URL,
        );
    }

    /**
     * Create a new client configured for the Arbitrum One mainnet.
     */
    static newArbitrumOneClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(
            apiKey,
            apiSecret,
            ARBITRUM_ONE_BASE_URL,
            ARBITRUM_ONE_RELAYER_URL,
        );
    }

    /**
     * Create a new client configured for the Base mainnet.
     */
    static newBaseMainnetClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(
            apiKey,
            apiSecret,
            BASE_MAINNET_BASE_URL,
            BASE_MAINNET_RELAYER_URL,
        );
    }

    // --- Quote methods (v1 signature, v2 internally) ---

    /**
     * Request a quote for the given order.
     */
    async requestQuote(order: ExternalOrder): Promise<SignedExternalQuote | null> {
        return this.requestQuoteWithOptions(order, RequestQuoteOptions.new());
    }

    /**
     * Request a quote for the given order with custom options.
     */
    async requestQuoteWithOptions(
        order: ExternalOrder,
        options: RequestQuoteOptions,
    ): Promise<SignedExternalQuote | null> {
        validateExternalOrder(order);
        const v2Order = v1OrderToV2(order);
        const body = serializeQuoteRequestV2({ external_order: v2Order });

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<any>(path, body, headers);

        return this.handleOptionalResponse(response, (data) => {
            const v2Response = deserializeQuoteResponseV2(data);
            return v2QuoteToV1(v2Response, order);
        });
    }

    // --- Assemble methods (v1 signature, v2 internally) ---

    /**
     * Assemble a quote into a match bundle with default options.
     */
    async assembleQuote(quote: SignedExternalQuote): Promise<ExternalMatchResponse | null> {
        return this.assembleQuoteWithOptions(quote, AssembleExternalMatchOptions.new());
    }

    /**
     * Assemble a quote into a match bundle with custom options.
     */
    async assembleQuoteWithOptions(
        quote: SignedExternalQuote,
        options: AssembleExternalMatchOptions,
    ): Promise<ExternalMatchResponse | null> {
        if (options.updatedOrder) {
            validateExternalOrder(options.updatedOrder);
        }

        const direction = quote.quote.order.side;
        const v2SignedQuote = v1QuoteToV2(quote);

        const request: AssembleExternalMatchRequestV2 = {
            do_gas_estimation: options.doGasEstimation,
            receiver_address: options.receiverAddress,
            order: {
                type: "quoted-order",
                signed_quote: v2SignedQuote,
                updated_order: options.updatedOrder ? v1OrderToV2(options.updatedOrder) : undefined,
            },
        };

        const body = serializeAssembleRequestV2(request);
        const path = ASSEMBLE_MATCH_BUNDLE_ROUTE;
        const headers = this.getHeaders();

        const response = await this.httpClient.post<any>(path, body, headers);

        return this.handleOptionalResponse(response, (data) => {
            const v2Resp = deserializeMatchResponseV2(data);
            return v2ResponseToV1NonMalleable(v2Resp, direction);
        });
    }

    // --- Direct match methods (v1 signature, v2 internally) ---

    /**
     * Request an external match directly with default options.
     */
    async requestExternalMatch(order: ExternalOrder): Promise<ExternalMatchResponse | null> {
        return this.requestExternalMatchWithOptions(order, RequestExternalMatchOptions.new());
    }

    /**
     * Request an external match directly with custom options.
     */
    async requestExternalMatchWithOptions(
        order: ExternalOrder,
        options: RequestExternalMatchOptions,
    ): Promise<ExternalMatchResponse | null> {
        validateExternalOrder(order);
        const v2Order = v1OrderToV2(order);
        const request = buildDirectOrderRequest(v2Order, options);
        const body = serializeAssembleRequestV2(request);

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<any>(path, body, headers);

        return this.handleOptionalResponse(response, (data) => {
            const v2Resp = deserializeMatchResponseV2(data);
            return v2ResponseToV1NonMalleable(v2Resp, order.side);
        });
    }

    // --- Malleable match methods (v1 input, v2 response — breaking) ---

    /**
     * Request a malleable external match directly with default options.
     */
    async requestMalleableExternalMatch(
        order: ExternalOrder,
    ): Promise<MalleableExternalMatchResponse | null> {
        return this.requestMalleableExternalMatchWithOptions(
            order,
            RequestExternalMatchOptions.new(),
        );
    }

    /**
     * Request a malleable external match directly with custom options.
     */
    async requestMalleableExternalMatchWithOptions(
        order: ExternalOrder,
        options: RequestExternalMatchOptions,
    ): Promise<MalleableExternalMatchResponse | null> {
        validateExternalOrder(order);
        const v2Order = v1OrderToV2(order);
        const request = buildDirectOrderRequest(v2Order, options);
        const body = serializeAssembleRequestV2(request);

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<any>(path, body, headers);

        return this.handleOptionalResponse(response, MalleableExternalMatchResponse.deserialize);
    }

    /**
     * Assemble a quote into a malleable match bundle with default options.
     */
    async assembleMalleableQuote(
        quote: SignedExternalQuote,
    ): Promise<MalleableExternalMatchResponse | null> {
        return this.assembleMalleableQuoteWithOptions(
            quote,
            AssembleMalleableExternalMatchOptions.new(),
        );
    }

    /**
     * Assemble a quote into a malleable match bundle with custom options.
     */
    async assembleMalleableQuoteWithOptions(
        quote: SignedExternalQuote,
        options: AssembleMalleableExternalMatchOptions,
    ): Promise<MalleableExternalMatchResponse | null> {
        if (options.updatedOrder) {
            validateExternalOrder(options.updatedOrder);
        }

        const v2SignedQuote = v1QuoteToV2(quote);

        const request: AssembleExternalMatchRequestV2 = {
            do_gas_estimation: options.doGasEstimation,
            receiver_address: options.receiverAddress,
            order: {
                type: "quoted-order",
                signed_quote: v2SignedQuote,
                updated_order: options.updatedOrder ? v1OrderToV2(options.updatedOrder) : undefined,
            },
        };

        const body = serializeAssembleRequestV2(request);
        const path = ASSEMBLE_MATCH_BUNDLE_ROUTE;
        const headers = this.getHeaders();

        const response = await this.httpClient.post<any>(path, body, headers);

        return this.handleOptionalResponse(response, MalleableExternalMatchResponse.deserialize);
    }

    // --- New v2 market methods ---

    /**
     * Get all tradable markets.
     */
    async getMarkets(): Promise<GetMarketsResponse> {
        const client = this.relayerHttpClient ?? this.httpClient;
        const response = await client.get<any>(GET_MARKETS_ROUTE);

        if (response.status !== 200 || !response.data) {
            throw new ExternalMatchClientError("Failed to get markets", response.status);
        }

        return deserializeMarketsResponse(response.data);
    }

    /**
     * Get market depth for a given base token mint.
     */
    async getMarketDepth(mint: string): Promise<GetMarketDepthByMintResponse> {
        const path = `${GET_MARKET_DEPTH_BY_MINT_ROUTE}/${mint}/depth`;
        const headers = this.getHeaders();

        const response = await this.httpClient.get<any>(path, headers);

        if (response.status !== 200 || !response.data) {
            throw new ExternalMatchClientError("Failed to get market depth", response.status);
        }

        return deserializeMarketDepthResponse(response.data);
    }

    /**
     * Get market depth for all pairs.
     */
    async getMarketDepthsAllPairs(): Promise<GetMarketDepthsResponse> {
        const headers = this.getHeaders();
        const response = await this.httpClient.get<any>(GET_MARKETS_DEPTH_ROUTE, headers);

        if (response.status !== 200 || !response.data) {
            throw new ExternalMatchClientError("Failed to get market depths", response.status);
        }

        return deserializeMarketDepthsResponse(response.data);
    }

    // --- Deprecated v1 methods (shimmed through v2) ---

    /**
     * @deprecated Use getMarkets() instead
     */
    async getSupportedTokens(): Promise<SupportedTokensResponse> {
        const resp = await this.getMarkets();
        return marketsToSupportedTokens(resp);
    }

    /**
     * @deprecated Use getMarkets() instead
     */
    async getTokenPrices(): Promise<TokenPricesResponse> {
        const resp = await this.getMarkets();
        return marketsToTokenPrices(resp);
    }

    /**
     * @deprecated Use getMarketDepth() instead
     */
    async getOrderBookDepth(mint: string): Promise<OrderBookDepth | null> {
        const resp = await this.getMarketDepth(mint);
        return marketDepthToV1(resp);
    }

    /**
     * @deprecated Use getMarketDepthsAllPairs() instead
     */
    async getOrderBookDepthAllPairs(): Promise<GetDepthForAllPairsResponse | null> {
        const resp = await this.getMarketDepthsAllPairs();
        return marketDepthsToV1(resp);
    }

    /**
     * Get exchange metadata including chain ID, settlement contract address, and supported tokens
     */
    async getExchangeMetadata(): Promise<ExchangeMetadataResponse> {
        const path = GET_EXCHANGE_METADATA_ROUTE;
        const headers = this.getHeaders();

        const response = await this.httpClient.get<ExchangeMetadataResponse>(path, headers);
        return this.handleOptionalResponse(
            response,
            ExchangeMetadataResponse.deserialize,
        ) as ExchangeMetadataResponse;
    }

    // --- Private helpers ---

    private handleOptionalResponse<T>(
        response: HttpResponse<any>,
        deserialize: (data: any) => T,
    ): T | null {
        if (response.status === 204) {
            return null;
        }

        if (response.status === 200) {
            return deserialize(response.data);
        }

        const errorMessage = this.extractErrorMessage(response.data);
        throw new ExternalMatchClientError(errorMessage, response.status);
    }

    private extractErrorMessage(data: any): string {
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
            return data.error;
        }
        return typeof data === "string" ? data : JSON.stringify(data);
    }

    private getHeaders(): Record<string, string> {
        return {
            [RENEGADE_API_KEY_HEADER]: this.apiKey,
            [RENEGADE_SDK_VERSION_HEADER]: getSdkVersion(),
        };
    }
}
