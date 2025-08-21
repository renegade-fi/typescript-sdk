/**
 * Renegade External Match Client
 * A TypeScript client for interacting with the Renegade Darkpool API.
 */

// Export main client
export {
    AssembleExternalMatchOptions,
    ExternalMatchClient,
    ExternalMatchClientError,
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
    ExternalMatchResponse,
    ExternalOrder,
    ExternalQuoteRequest,
    ExternalQuoteResponse,
    FeeTake,
    GasSponsorshipInfo,
    SettlementTransaction,
    SignedExternalQuote,
    SignedGasSponsorshipInfo,
} from "./types/index.js";

// Export enums
export { OrderSide } from "./types/index.js";
