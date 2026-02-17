/**
 * Internal v2 API types and serialization/deserialization helpers.
 *
 * These types define the wire format for v2 API communication.
 * They are NOT exported from the package entry point.
 */

import type {
    ApiExternalAssetTransfer,
    ApiToken,
    FeeTake,
    FeeTakeRate,
    GasSponsorshipInfo,
    SettlementTransaction,
} from "./index.js";

// --- Order ---

export interface ExternalOrderV2 {
    input_mint: string;
    output_mint: string;
    input_amount: bigint;
    output_amount: bigint;
    use_exact_output_amount: boolean;
    min_fill_size: bigint;
}

// --- Quote response types ---

export interface ApiTimestampedPriceFp {
    price: string;
    timestamp: number;
}

export interface ApiExternalMatchResultV2 {
    input_mint: string;
    output_mint: string;
    input_amount: bigint;
    output_amount: bigint;
    price_fp: ApiTimestampedPriceFp;
}

export interface ApiExternalQuoteV2 {
    order: ExternalOrderV2;
    match_result: ApiExternalMatchResultV2;
    fees: FeeTake;
    send: ApiExternalAssetTransfer;
    receive: ApiExternalAssetTransfer;
    price: { price: string; timestamp: number };
    timestamp: number;
}

export interface ApiSignedQuoteV2 {
    quote: ApiExternalQuoteV2;
    signature: string;
    deadline: number;
}

export interface ExternalQuoteResponseV2 {
    signed_quote: ApiSignedQuoteV2;
    gas_sponsorship_info?: GasSponsorshipInfo;
}

// --- Assemble request ---

export type AssemblyType =
    | {
          type: "quoted-order";
          signed_quote: ApiSignedQuoteV2;
          updated_order?: ExternalOrderV2 | null;
      }
    | { type: "direct-order"; external_order: ExternalOrderV2 };

export interface AssembleExternalMatchRequestV2 {
    do_gas_estimation: boolean;
    receiver_address?: string | null;
    order: AssemblyType;
}

// --- Match response (always malleable from v2 API) ---

export interface ApiBoundedMatchResultV2 {
    input_mint: string;
    output_mint: string;
    price_fp: string;
    min_input_amount: bigint;
    max_input_amount: bigint;
}

export interface MalleableAtomicMatchApiBundleV2 {
    match_result: ApiBoundedMatchResultV2;
    fee_rates: FeeTakeRate;
    max_receive: ApiExternalAssetTransfer;
    min_receive: ApiExternalAssetTransfer;
    max_send: ApiExternalAssetTransfer;
    min_send: ApiExternalAssetTransfer;
    settlement_tx: SettlementTransaction;
    deadline: number;
}

export interface ExternalMatchResponseV2 {
    match_bundle: MalleableAtomicMatchApiBundleV2;
    input_amount?: bigint | null;
    gas_sponsorship_info?: GasSponsorshipInfo | null;
}

// --- Market types (public) ---

export interface MarketInfo {
    base: ApiToken;
    quote: ApiToken;
    price: { price: string; timestamp: number };
    internal_match_fee_rates: FeeTakeRate;
    external_match_fee_rates: FeeTakeRate;
}

export interface DepthSide {
    total_quantity: bigint;
    total_quantity_usd: number;
}

export interface MarketDepth {
    market: MarketInfo;
    buy: DepthSide;
    sell: DepthSide;
}

export interface GetMarketsResponse {
    markets: MarketInfo[];
}

export interface GetMarketDepthByMintResponse {
    market_depth: MarketDepth;
}

export interface GetMarketDepthsResponse {
    market_depths: MarketDepth[];
}

// --- Serialization helpers (BigInt → string for v2 wire format) ---

function serializeOrderV2(order: ExternalOrderV2): Record<string, unknown> {
    return {
        input_mint: order.input_mint,
        output_mint: order.output_mint,
        input_amount: order.input_amount.toString(),
        output_amount: order.output_amount.toString(),
        use_exact_output_amount: order.use_exact_output_amount,
        min_fill_size: order.min_fill_size.toString(),
    };
}

function serializeMatchResultV2(mr: ApiExternalMatchResultV2): Record<string, unknown> {
    return {
        input_mint: mr.input_mint,
        output_mint: mr.output_mint,
        input_amount: mr.input_amount.toString(),
        output_amount: mr.output_amount.toString(),
        price_fp: mr.price_fp,
    };
}

function serializeFeeTake(fees: FeeTake): Record<string, unknown> {
    return {
        relayer_fee: fees.relayer_fee.toString(),
        protocol_fee: fees.protocol_fee.toString(),
    };
}

function serializeAssetTransfer(t: ApiExternalAssetTransfer): Record<string, unknown> {
    return {
        mint: t.mint,
        amount: t.amount.toString(),
    };
}

function serializeQuoteV2(quote: ApiExternalQuoteV2): Record<string, unknown> {
    return {
        order: serializeOrderV2(quote.order),
        match_result: serializeMatchResultV2(quote.match_result),
        fees: serializeFeeTake(quote.fees),
        send: serializeAssetTransfer(quote.send),
        receive: serializeAssetTransfer(quote.receive),
        price: quote.price,
        timestamp: quote.timestamp,
    };
}

function serializeApiSignedQuoteV2(sq: ApiSignedQuoteV2): Record<string, unknown> {
    return {
        quote: serializeQuoteV2(sq.quote),
        signature: sq.signature,
        deadline: sq.deadline,
    };
}

export function serializeQuoteRequestV2(req: {
    external_order: ExternalOrderV2;
}): Record<string, unknown> {
    return {
        external_order: serializeOrderV2(req.external_order),
    };
}

export function serializeAssembleRequestV2(
    req: AssembleExternalMatchRequestV2,
): Record<string, unknown> {
    let order: Record<string, unknown>;
    if (req.order.type === "quoted-order") {
        order = {
            type: "quoted-order",
            signed_quote: serializeApiSignedQuoteV2(req.order.signed_quote),
            updated_order: req.order.updated_order
                ? serializeOrderV2(req.order.updated_order)
                : undefined,
        };
    } else {
        order = {
            type: "direct-order",
            external_order: serializeOrderV2(req.order.external_order),
        };
    }

    return {
        do_gas_estimation: req.do_gas_estimation,
        receiver_address: req.receiver_address ?? undefined,
        order,
    };
}

// --- Deserialization helpers (string → BigInt from API JSON) ---

function deserializeOrderV2(data: any): ExternalOrderV2 {
    return {
        input_mint: data.input_mint,
        output_mint: data.output_mint,
        input_amount: BigInt(data.input_amount),
        output_amount: BigInt(data.output_amount),
        use_exact_output_amount: data.use_exact_output_amount,
        min_fill_size: BigInt(data.min_fill_size),
    };
}

function deserializeMatchResultV2(data: any): ApiExternalMatchResultV2 {
    return {
        input_mint: data.input_mint,
        output_mint: data.output_mint,
        input_amount: BigInt(data.input_amount),
        output_amount: BigInt(data.output_amount),
        price_fp: {
            price: data.price_fp.price,
            timestamp: Number(data.price_fp.timestamp),
        },
    };
}

function deserializeFeeTake(data: any): FeeTake {
    return {
        relayer_fee: BigInt(data.relayer_fee),
        protocol_fee: BigInt(data.protocol_fee),
    };
}

function deserializeAssetTransfer(data: any): ApiExternalAssetTransfer {
    return {
        mint: data.mint,
        amount: BigInt(data.amount),
    };
}

function deserializeGasSponsorshipInfo(data: any): GasSponsorshipInfo | undefined {
    if (!data) return undefined;
    return {
        refund_amount: BigInt(data.refund_amount),
        refund_native_eth: data.refund_native_eth,
        refund_address: data.refund_address,
    };
}

export function deserializeQuoteResponseV2(data: any): ExternalQuoteResponseV2 {
    const sq = data.signed_quote;
    const q = sq.quote;
    return {
        signed_quote: {
            quote: {
                order: deserializeOrderV2(q.order),
                match_result: deserializeMatchResultV2(q.match_result),
                fees: deserializeFeeTake(q.fees),
                send: deserializeAssetTransfer(q.send),
                receive: deserializeAssetTransfer(q.receive),
                price: q.price,
                timestamp: Number(q.timestamp),
            },
            signature: sq.signature,
            deadline: Number(sq.deadline),
        },
        gas_sponsorship_info: deserializeGasSponsorshipInfo(data.gas_sponsorship_info),
    };
}

function deserializeFeeTakeRate(data: any): FeeTakeRate {
    return {
        relayer_fee_rate: data.relayer_fee_rate,
        protocol_fee_rate: data.protocol_fee_rate,
    };
}

function deserializeBoundedMatchResultV2(data: any): ApiBoundedMatchResultV2 {
    return {
        input_mint: data.input_mint,
        output_mint: data.output_mint,
        price_fp: data.price_fp,
        min_input_amount: BigInt(data.min_input_amount),
        max_input_amount: BigInt(data.max_input_amount),
    };
}

/**
 * Normalize an Alloy TransactionRequest into our SettlementTransaction format.
 *
 * Alloy uses `input` for calldata; our v1 type uses `data`.
 */
function deserializeSettlementTx(raw: any): SettlementTransaction {
    return {
        tx_type: raw.type ?? raw.tx_type ?? "0x0",
        to: raw.to,
        data: raw.input ?? raw.data,
        value: raw.value ?? "0x0",
        gas: raw.gas,
    };
}

export function deserializeMatchResponseV2(data: any): ExternalMatchResponseV2 {
    const mb = data.match_bundle;
    return {
        match_bundle: {
            match_result: deserializeBoundedMatchResultV2(mb.match_result),
            fee_rates: deserializeFeeTakeRate(mb.fee_rates),
            max_receive: deserializeAssetTransfer(mb.max_receive),
            min_receive: deserializeAssetTransfer(mb.min_receive),
            max_send: deserializeAssetTransfer(mb.max_send),
            min_send: deserializeAssetTransfer(mb.min_send),
            settlement_tx: deserializeSettlementTx(mb.settlement_tx),
            deadline: Number(mb.deadline),
        },
        input_amount: data.input_amount != null ? BigInt(data.input_amount) : undefined,
        gas_sponsorship_info: deserializeGasSponsorshipInfo(data.gas_sponsorship_info),
    };
}

function deserializeMarketInfo(data: any): MarketInfo {
    return {
        base: data.base,
        quote: data.quote,
        price: data.price,
        internal_match_fee_rates: deserializeFeeTakeRate(data.internal_match_fee_rates),
        external_match_fee_rates: deserializeFeeTakeRate(data.external_match_fee_rates),
    };
}

function deserializeDepthSide(data: any): DepthSide {
    return {
        total_quantity: BigInt(data.total_quantity),
        total_quantity_usd: Number(data.total_quantity_usd),
    };
}

function deserializeMarketDepth(data: any): MarketDepth {
    return {
        market: deserializeMarketInfo(data.market),
        buy: deserializeDepthSide(data.buy),
        sell: deserializeDepthSide(data.sell),
    };
}

export function deserializeMarketsResponse(data: any): GetMarketsResponse {
    return {
        markets: data.markets.map(deserializeMarketInfo),
    };
}

export function deserializeMarketDepthResponse(data: any): GetMarketDepthByMintResponse {
    return {
        market_depth: deserializeMarketDepth(data.market_depth),
    };
}

export function deserializeMarketDepthsResponse(data: any): GetMarketDepthsResponse {
    return {
        market_depths: data.market_depths.map(deserializeMarketDepth),
    };
}
