/**
 * Client for interacting with the Renegade external matching API.
 *
 * This client handles authentication and provides methods for requesting quotes,
 * assembling matches, and executing trades.
 */

import { type HttpResponse, RelayerHttpClient } from "./http.js";
import type {
    ApiSignedExternalQuote,
    AssembleExternalMatchRequest,
    ExternalMatchRequest,
    ExternalOrder,
    ExternalQuoteRequest,
    ExternalQuoteResponse,
    SupportedTokensResponse,
    TokenPrice,
    TokenPricesResponse,
} from "./types/index.js";
import {
    ExchangeMetadataResponse,
    ExternalMatchResponse,
    MalleableExternalMatchResponse,
    OrderBookDepth,
    SignedExternalQuote,
} from "./types/index.js";
import { VERSION } from "./version.js";

// Constants for API URLs
const ARBITRUM_SEPOLIA_BASE_URL = "https://arbitrum-sepolia.auth-server.renegade.fi";
const ARBITRUM_ONE_BASE_URL = "https://arbitrum-one.auth-server.renegade.fi";
const BASE_SEPOLIA_BASE_URL = "https://base-sepolia.auth-server.renegade.fi";
const BASE_MAINNET_BASE_URL = "https://base-mainnet.auth-server.renegade.fi";

const ARBITRUM_SEPOLIA_RELAYER_URL = "https://arbitrum-sepolia.relayer.renegade.fi";
const ARBITRUM_ONE_RELAYER_URL = "https://arbitrum-one.relayer.renegade.fi";
const BASE_SEPOLIA_RELAYER_URL = "https://base-sepolia.relayer.renegade.fi";
const BASE_MAINNET_RELAYER_URL = "https://base-mainnet.relayer.renegade.fi";

// Header constants
const RENEGADE_API_KEY_HEADER = "x-renegade-api-key";
const RENEGADE_SDK_VERSION_HEADER = "x-renegade-sdk-version";

// API Routes
const REQUEST_EXTERNAL_QUOTE_ROUTE = "/v0/matching-engine/quote";
const ASSEMBLE_EXTERNAL_MATCH_ROUTE = "/v0/matching-engine/assemble-external-match";
/**
 * The route used to assemble an external match into a malleable bundle
 */
const ASSEMBLE_MALLEABLE_EXTERNAL_MATCH_ROUTE =
    "/v0/matching-engine/assemble-malleable-external-match";
const REQUEST_EXTERNAL_MATCH_ROUTE = "/v0/matching-engine/request-external-match";
/**
 * The route used to request a malleable external match directly
 */
const REQUEST_MALLEABLE_EXTERNAL_MATCH_ROUTE =
    "/v0/matching-engine/request-malleable-external-match";
const ORDER_BOOK_DEPTH_ROUTE = "/v0/order_book/depth";
/** Returns the supported tokens list */
const SUPPORTED_TOKENS_ROUTE = "/v0/supported-tokens";
/** Returns the token prices */
const TOKEN_PRICES_ROUTE = "/v0/token-prices";
/** Returns the exchange metadata */
const EXCHANGE_METADATA_ROUTE = "/v0/exchange-metadata";

// Query Parameters
const DISABLE_GAS_SPONSORSHIP_QUERY_PARAM = "disable_gas_sponsorship";
const GAS_REFUND_ADDRESS_QUERY_PARAM = "refund_address";
const REFUND_NATIVE_ETH_QUERY_PARAM = "refund_native_eth";

/**
 * Get the SDK version string.
 *
 * @returns The SDK version prefixed with "typescript-v"
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

    /**
     * Create a new instance of RequestQuoteOptions.
     */
    static new(): RequestQuoteOptions {
        return new RequestQuoteOptions();
    }

    /**
     * Set whether gas sponsorship should be disabled.
     */
    withGasSponsorshipDisabled(disableGasSponsorship: boolean): this {
        this.disableGasSponsorship = disableGasSponsorship;
        return this;
    }

    /**
     * Set the gas refund address.
     */
    withGasRefundAddress(gasRefundAddress: string): this {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    /**
     * Set whether to refund in native ETH.
     */
    withRefundNativeEth(refundNativeEth: boolean): this {
        this.refundNativeEth = refundNativeEth;
        return this;
    }

    /**
     * Build the request path with query parameters.
     */
    buildRequestPath(): string {
        const params = new URLSearchParams();
        params.set(DISABLE_GAS_SPONSORSHIP_QUERY_PARAM, this.disableGasSponsorship.toString());
        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        if (this.refundNativeEth) {
            params.set(REFUND_NATIVE_ETH_QUERY_PARAM, this.refundNativeEth.toString());
        }

        return `${REQUEST_EXTERNAL_QUOTE_ROUTE}?${params.toString()}`;
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

    /**
     * Create a new instance of RequestExternalMatchOptions.
     */
    static new(): RequestExternalMatchOptions {
        return new RequestExternalMatchOptions();
    }

    /**
     * Set whether gas sponsorship should be disabled.
     */
    withGasSponsorshipDisabled(disableGasSponsorship: boolean): this {
        this.disableGasSponsorship = disableGasSponsorship;
        return this;
    }

    /**
     * Set the gas refund address.
     */
    withGasRefundAddress(gasRefundAddress: string): this {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    /**
     * Set whether to refund in native ETH.
     */
    withRefundNativeEth(refundNativeEth: boolean): this {
        this.refundNativeEth = refundNativeEth;
        return this;
    }

    /**
     * Set whether the relayer should include gas estimation in the response.
     */
    withGasEstimation(doGasEstimation: boolean): this {
        this.doGasEstimation = doGasEstimation;
        return this;
    }

    /**
     * Set the receiver address for the match.
     */
    withReceiverAddress(receiverAddress: string): this {
        this.receiverAddress = receiverAddress;
        return this;
    }

    /**
     * Build the request path with query parameters.
     */
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
            ? `${REQUEST_EXTERNAL_MATCH_ROUTE}?${query}`
            : REQUEST_EXTERNAL_MATCH_ROUTE;
    }

    /**
     * Build the request path for malleable external match with query parameters.
     */
    buildMalleableRequestPath(): string {
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
            ? `${REQUEST_MALLEABLE_EXTERNAL_MATCH_ROUTE}?${query}`
            : REQUEST_MALLEABLE_EXTERNAL_MATCH_ROUTE;
    }
}

/**
 * Options for assembling an external match.
 */
export class AssembleExternalMatchOptions {
    doGasEstimation = false;
    allowShared = false;
    receiverAddress?: string;
    updatedOrder?: ExternalOrder;
    requestGasSponsorship = false;
    gasRefundAddress?: string;

    /**
     * Create a new instance of AssembleExternalMatchOptions.
     */
    static new(): AssembleExternalMatchOptions {
        return new AssembleExternalMatchOptions();
    }

    /**
     * Set whether to do gas estimation.
     */
    withGasEstimation(doGasEstimation: boolean): AssembleExternalMatchOptions {
        this.doGasEstimation = doGasEstimation;
        return this;
    }

    /**
     * Set whether to allow shared gas sponsorship.
     */
    withAllowShared(allowShared: boolean): AssembleExternalMatchOptions {
        this.allowShared = allowShared;
        return this;
    }

    /**
     * Set the receiver address.
     */
    withReceiverAddress(receiverAddress: string): AssembleExternalMatchOptions {
        this.receiverAddress = receiverAddress;
        return this;
    }

    /**
     * Set the updated order.
     */
    withUpdatedOrder(updatedOrder: ExternalOrder): AssembleExternalMatchOptions {
        this.updatedOrder = updatedOrder;
        return this;
    }

    /**
     * Set whether to request gas sponsorship.
     * @deprecated Request gas sponsorship when requesting a quote instead
     */
    withGasSponsorship(requestGasSponsorship: boolean): AssembleExternalMatchOptions {
        this.requestGasSponsorship = requestGasSponsorship;
        return this;
    }

    /**
     * Set the gas refund address.
     * @deprecated Request gas sponsorship when requesting a quote instead
     */
    withGasRefundAddress(gasRefundAddress: string): AssembleExternalMatchOptions {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    /**
     * Build the request path with query parameters.
     */
    buildRequestPath(): string {
        // If no query parameters are needed, return the base path
        if (!this.requestGasSponsorship && !this.gasRefundAddress) {
            return ASSEMBLE_EXTERNAL_MATCH_ROUTE;
        }

        const params = new URLSearchParams();
        if (this.requestGasSponsorship) {
            // We only write this query parameter if it was explicitly set
            params.set(
                DISABLE_GAS_SPONSORSHIP_QUERY_PARAM,
                (!this.requestGasSponsorship).toString(),
            );
        }

        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        return `${ASSEMBLE_EXTERNAL_MATCH_ROUTE}?${params.toString()}`;
    }
}

/**
 * Options for assembling a malleable external match.
 */
export class AssembleMalleableExternalMatchOptions extends AssembleExternalMatchOptions {
    /**
     * Create a new instance of AssembleExternalMatchOptions.
     */
    static override new(): AssembleMalleableExternalMatchOptions {
        return new AssembleMalleableExternalMatchOptions();
    }
    /**
     * Build the request path with query parameters.
     */
    override buildRequestPath(): string {
        // If no query parameters are needed, return the base path
        if (!this.requestGasSponsorship && !this.gasRefundAddress) {
            return ASSEMBLE_MALLEABLE_EXTERNAL_MATCH_ROUTE;
        }

        const params = new URLSearchParams();
        if (this.requestGasSponsorship) {
            // We only write this query parameter if it was explicitly set
            params.set(
                DISABLE_GAS_SPONSORSHIP_QUERY_PARAM,
                (!this.requestGasSponsorship).toString(),
            );
        }

        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        return `${ASSEMBLE_MALLEABLE_EXTERNAL_MATCH_ROUTE}?${params.toString()}`;
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
 * Client for interacting with the Renegade external matching API.
 */
export class ExternalMatchClient {
    private apiKey: string;
    private httpClient: RelayerHttpClient;
    private relayerHttpClient: RelayerHttpClient;

    /**
     * Initialize a new ExternalMatchClient.
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @param baseUrl The base URL of the Renegade API
     */
    constructor(apiKey: string, apiSecret: string, baseUrl: string, relayerUrl: string) {
        this.apiKey = apiKey;
        this.httpClient = new RelayerHttpClient(baseUrl, apiSecret);
        this.relayerHttpClient = new RelayerHttpClient(relayerUrl);
    }

    /**
     * Create a new client configured for the Arbitrum Sepolia testnet.
     *
     * @deprecated Use {@link ExternalMatchClient.newArbitrumSepoliaClient} instead
     */
    static newSepoliaClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return ExternalMatchClient.newArbitrumSepoliaClient(apiKey, apiSecret);
    }

    /**
     * Create a new client configured for the Arbitrum Sepolia testnet.
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @param relayerUrl The relayer URL for the client
     * @returns A new ExternalMatchClient configured for Sepolia
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
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @returns A new ExternalMatchClient configured for Sepolia
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
     *
     * @deprecated Use {@link ExternalMatchClient.newArbitrumOneClient} instead
     */
    static newMainnetClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return ExternalMatchClient.newArbitrumOneClient(apiKey, apiSecret);
    }

    /**
     * Create a new client configured for the Arbitrum One mainnet.
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @returns A new ExternalMatchClient configured for mainnet
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
     *
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @returns A new ExternalMatchClient configured for mainnet
     */
    static newBaseMainnetClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(
            apiKey,
            apiSecret,
            BASE_MAINNET_BASE_URL,
            BASE_MAINNET_RELAYER_URL,
        );
    }

    /**
     * Request a quote for the given order.
     *
     * @param order The order to request a quote for
     * @returns A promise that resolves to a signed quote if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async requestQuote(order: ExternalOrder): Promise<SignedExternalQuote | null> {
        return this.requestQuoteWithOptions(order, RequestQuoteOptions.new());
    }

    /**
     * Request a quote for the given order with custom options.
     *
     * @param order The order to request a quote for
     * @param options Custom options for the quote request
     * @returns A promise that resolves to a signed quote if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async requestQuoteWithOptions(
        order: ExternalOrder,
        options: RequestQuoteOptions,
    ): Promise<SignedExternalQuote | null> {
        const request: ExternalQuoteRequest = {
            external_order: order,
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<ExternalQuoteResponse>(path, request, headers);

        return this.handleOptionalResponse(response, SignedExternalQuote.deserialize);
    }

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
        const request: ExternalMatchRequest = {
            do_gas_estimation: options.doGasEstimation,
            receiver_address: options.receiverAddress,
            external_order: order,
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<ExternalMatchResponse>(path, request, headers);

        return this.handleOptionalResponse(response, ExternalMatchResponse.deserialize);
    }

    /**
     * Request a malleable external match directly with default options.
     *
     * @param order The order to request a malleable match for
     * @returns A promise that resolves to a malleable match response if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
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
     *
     * @param order The order to request a malleable match for
     * @param options Custom options for the malleable match request
     * @returns A promise that resolves to a malleable match response if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async requestMalleableExternalMatchWithOptions(
        order: ExternalOrder,
        options: RequestExternalMatchOptions,
    ): Promise<MalleableExternalMatchResponse | null> {
        const request: ExternalMatchRequest = {
            do_gas_estimation: options.doGasEstimation,
            receiver_address: options.receiverAddress,
            external_order: order,
        };

        const path = options.buildMalleableRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<MalleableExternalMatchResponse>(
            path,
            request,
            headers,
        );

        return this.handleOptionalResponse(response, MalleableExternalMatchResponse.deserialize);
    }

    /**
     * Assemble a quote into a match bundle with default options.
     *
     * @param quote The signed quote to assemble
     * @returns A promise that resolves to a match response if assembly succeeds, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async assembleQuote(quote: SignedExternalQuote): Promise<ExternalMatchResponse | null> {
        return this.assembleQuoteWithOptions(quote, AssembleExternalMatchOptions.new());
    }

    /**
     * Assemble a quote into a match bundle with custom options.
     *
     * @param quote The signed quote to assemble
     * @param options Custom options for quote assembly
     * @returns A promise that resolves to a match response if assembly succeeds, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async assembleQuoteWithOptions(
        quote: SignedExternalQuote,
        options: AssembleExternalMatchOptions,
    ): Promise<ExternalMatchResponse | null> {
        const signedQuote: ApiSignedExternalQuote = {
            quote: quote.quote,
            signature: quote.signature,
        };

        const request: AssembleExternalMatchRequest = {
            do_gas_estimation: options.doGasEstimation,
            allow_shared: options.allowShared,
            receiver_address: options.receiverAddress,
            signed_quote: signedQuote,
            updated_order: options.updatedOrder,
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<ExternalMatchResponse>(path, request, headers);

        return this.handleOptionalResponse(response, ExternalMatchResponse.deserialize);
    }

    /**
     * Assemble a quote into a malleable match bundle with default options.
     *
     * @param quote The signed quote to assemble
     * @returns A promise that resolves to a match response if assembly succeeds, null otherwise
     * @throws ExternalMatchClientError if the request fails
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
        const signedQuote: ApiSignedExternalQuote = {
            quote: quote.quote,
            signature: quote.signature,
        };

        const request: AssembleExternalMatchRequest = {
            do_gas_estimation: options.doGasEstimation,
            allow_shared: options.allowShared,
            receiver_address: options.receiverAddress,
            signed_quote: signedQuote,
            updated_order: options.updatedOrder,
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        const response = await this.httpClient.post<MalleableExternalMatchResponse>(
            path,
            request,
            headers,
        );

        return this.handleOptionalResponse(response, MalleableExternalMatchResponse.deserialize);
    }

    /**
     * Get order book depth for a given base token mint.
     *
     * @param mint The base token mint address
     * @returns A promise that resolves to the order book depth
     * @throws ExternalMatchClientError if the request fails
     */
    async getOrderBookDepth(mint: string): Promise<OrderBookDepth> {
        const path = `${ORDER_BOOK_DEPTH_ROUTE}/${mint}`;
        const headers = this.getHeaders();

        try {
            const response = await this.httpClient.get<OrderBookDepth>(path, headers);
            if (response.status !== 200 || !response.data) {
                throw new ExternalMatchClientError(
                    "Failed to get order book depth",
                    response.status,
                );
            }
            return OrderBookDepth.deserialize(response.data);
        } catch (error: any) {
            throw new ExternalMatchClientError(
                error.message || "Failed to get order book depth",
                error.status,
            );
        }
    }

    /**
     * Get a list of supported tokens for external matches
     */
    async getSupportedTokens(): Promise<SupportedTokensResponse> {
        const path = `${SUPPORTED_TOKENS_ROUTE}`;
        const headers = this.getHeaders();

        try {
            const response = await this.relayerHttpClient.get<SupportedTokensResponse>(
                path,
                headers,
            );
            if (response.status !== 200 || !response.data) {
                throw new ExternalMatchClientError(
                    "Failed to get supported tokens",
                    response.status,
                );
            }
            return response.data;
        } catch (error: any) {
            throw new ExternalMatchClientError(
                error.message || "Failed to get supported tokens",
                error.status,
            );
        }
    }

    /**
     * Get a list of token prices
     */
    async getTokenPrices(): Promise<TokenPricesResponse> {
        const path = `${TOKEN_PRICES_ROUTE}`;
        const headers = this.getHeaders();

        try {
            const response = await this.relayerHttpClient.get<TokenPricesResponse>(path, headers);
            if (response.status !== 200 || !response.data) {
                throw new ExternalMatchClientError("Failed to get token prices", response.status);
            }
            return {
                ...response.data,
                token_prices: response.data.token_prices.map((tokenPrice: TokenPrice) => ({
                    ...tokenPrice,
                    price: Number.parseFloat(tokenPrice.price.toString()),
                })),
            };
        } catch (error: any) {
            throw new ExternalMatchClientError(
                error.message || "Failed to get token prices",
                error.status,
            );
        }
    }

    /**
     * Get exchange metadata including chain ID, settlement contract address, and supported tokens
     */
    async getExchangeMetadata(): Promise<ExchangeMetadataResponse> {
        const path = `${EXCHANGE_METADATA_ROUTE}`;
        const headers = this.getHeaders();

        const response = await this.httpClient.get<ExchangeMetadataResponse>(path, headers);
        console.log("response", JSON.stringify(response, null, 2));
        return this.handleOptionalResponse(
            response,
            ExchangeMetadataResponse.deserialize,
        ) as ExchangeMetadataResponse;
    }

    /**
     * Handle an optional HTTP response, returning null for 204, deserializing for 200,
     * and throwing an error for other status codes.
     *
     * @param response The HTTP response
     * @param deserialize Function to deserialize the response data
     * @returns The deserialized response or null for 204
     * @throws ExternalMatchClientError for non-200/204 status codes
     */
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

    /**
     * Extract error message from an error response.
     * Per OpenAPI spec, error responses follow the ErrorResponse schema with an "error" field.
     *
     * @param data The response data (may be ErrorResponse object, string, or other)
     * @returns The extracted error message
     */
    private extractErrorMessage(data: any): string {
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
            return data.error;
        }
        return typeof data === "string" ? data : JSON.stringify(data);
    }
    /**
     * Get the headers required for API requests.
     *
     * @returns Headers containing the API key and SDK version
     */

    private getHeaders(): Record<string, string> {
        return {
            [RENEGADE_API_KEY_HEADER]: this.apiKey,
            [RENEGADE_SDK_VERSION_HEADER]: getSdkVersion(),
        };
    }
}
