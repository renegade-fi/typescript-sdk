import type { AccessList } from "viem";
import type { FeeTake, TimestampedPrice } from "./match.js";

/** An external order */
export type ExternalOrder = {
    base: `0x${string}`;
    quote: `0x${string}`;
    side: "buy" | "sell";
    baseAmount?: bigint;
    quoteAmount?: bigint;
    minFillSize?: bigint;
};

export type ExternalMatchResult = {
    quote_mint: `0x${string}`;
    base_mint: `0x${string}`;
    direction: "Buy" | "Sell";
    quote_amount: bigint;
    base_amount: bigint;
    min_fill_size: bigint;
};

export type ExternalSettlementTx = {
    type: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    accessList: AccessList;
    gas?: `0x${string}`;
    value?: `0x${string}`;
};

export type ExternalMatchQuote = {
    order: ExternalOrder;
    match_result: ExternalMatchResult;
    fees: FeeTake;
    send: ExternalAssetTransfer;
    receive: ExternalAssetTransfer;
    price: TimestampedPrice;
    timestamp: bigint;
};

export type SignedExternalMatchQuote = {
    quote: ExternalMatchQuote;
    signature: `0x${string}`;
};

export type SponsoredQuoteResponse = SignedExternalMatchQuote & {
    gas_sponsorship_info: SignedGasSponsorshipInfo | null;
};

export type SignedGasSponsorshipInfo = {
    gas_sponsorship_info: GasSponsorshipInfo;
    signature: `0x${string}`;
};

export type GasSponsorshipInfo = {
    refund_amount: bigint;
    refund_native_eth: boolean;
    refund_address: `0x${string}` | null;
};

export type ExternalMatchBundle = {
    match_result: ExternalMatchResult;
    settlement_tx: ExternalSettlementTx;
    receive: ExternalAssetTransfer;
    send: ExternalAssetTransfer;
    fees: FeeTake;
};

export type ExternalMatchResponse = {
    match_bundle: ExternalMatchBundle;
};

export type SponsoredMatchResponse = ExternalMatchResponse & {
    is_sponsored: boolean;
    gas_sponsorship_info: GasSponsorshipInfo | null;
};

export type ExternalAssetTransfer = {
    mint: `0x${string}`;
    amount: bigint;
};
