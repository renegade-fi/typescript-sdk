/**
 * A TypeScript client for interacting with the Renegade external match API.
 */

// Export main client
export {
    AssembleExternalMatchOptions,
    ExternalMatchClient,
    ExternalMatchClientError,
    RequestExternalMatchOptions,
    RequestQuoteOptions,
} from "./client.js";

// Export types
export type {
    ApiExternalAssetTransfer,
    ApiExternalMatchResult,
    ApiExternalQuote,
    ApiSignedExternalQuote,
    ApiTimestampedPrice,
    AssembleExternalMatchRequest,
    AtomicMatchApiBundle,
    ExternalMatchRequest,
    ExternalOrder,
    ExternalQuoteRequest,
    ExternalQuoteResponse,
    FeeTake,
    FeeTakeRate,
    GasSponsorshipInfo,
    SettlementTransaction,
    SignedGasSponsorshipInfo,
} from "./types/index.js";
// Export classes
// Export enums
export {
    ExchangeMetadataResponse,
    ExternalMatchResponse,
    MalleableExternalMatchResponse,
    OrderBookDepth,
    OrderSide,
    SignedExternalQuote,
} from "./types/index.js";

// Export new v2 market types
export type {
    DepthSide,
    GetMarketDepthByMintResponse,
    GetMarketDepthsResponse,
    GetMarketsResponse,
    MarketDepth,
    MarketInfo,
} from "./types/v2Types.js";
