/**
 * Renegade External Match Client
 * A TypeScript client for interacting with the Renegade Darkpool API.
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
