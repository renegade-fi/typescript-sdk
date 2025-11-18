/**
 * Type definitions for the Renegade Darkpool API.
 */

export enum OrderSide {
    BUY = "Buy",
    SELL = "Sell",
}

export interface ApiExternalAssetTransfer {
    mint: string;
    amount: bigint;
}

export interface ApiTimestampedPrice {
    price: string;
    timestamp: bigint;
}

export interface ApiExternalMatchResult {
    quote_mint: string;
    base_mint: string;
    quote_amount: bigint;
    base_amount: bigint;
    direction: OrderSide;
}

export interface FeeTake {
    relayer_fee: bigint;
    protocol_fee: bigint;
}

export interface FeeTakeRate {
    relayer_fee_rate: string;
    protocol_fee_rate: string;
}

export interface ExternalOrder {
    quote_mint: string;
    base_mint: string;
    side: OrderSide;
    base_amount?: bigint;
    quote_amount?: bigint;
    exact_base_output?: bigint;
    exact_quote_output?: bigint;
    min_fill_size?: bigint;
}

export interface ApiExternalQuote {
    order: ExternalOrder;
    match_result: ApiExternalMatchResult;
    fees: FeeTake;
    send: ApiExternalAssetTransfer;
    receive: ApiExternalAssetTransfer;
    price: ApiTimestampedPrice;
    timestamp: bigint;
}

export interface ApiSignedExternalQuote {
    quote: ApiExternalQuote;
    signature: string;
}

export interface GasSponsorshipInfo {
    refund_amount: bigint;
    refund_native_eth: boolean;
    refund_address?: string;
}

export interface SignedGasSponsorshipInfo {
    gas_sponsorship_info: GasSponsorshipInfo;
    signature: string;
}

export class SignedExternalQuote {
    quote: ApiExternalQuote;
    signature: string;
    gas_sponsorship_info?: SignedGasSponsorshipInfo;

    constructor(
        quote: ApiExternalQuote,
        signature: string,
        gas_sponsorship_info?: SignedGasSponsorshipInfo,
    ) {
        this.quote = quote;
        this.signature = signature;
        this.gas_sponsorship_info = gas_sponsorship_info;
    }

    static deserialize(data: ExternalQuoteResponse): SignedExternalQuote {
        const quote = data.signed_quote.quote;

        return new SignedExternalQuote(
            {
                order: quote.order,
                match_result: {
                    quote_mint: quote.match_result.quote_mint,
                    base_mint: quote.match_result.base_mint,
                    quote_amount: BigInt(quote.match_result.quote_amount),
                    base_amount: BigInt(quote.match_result.base_amount),
                    direction: quote.match_result.direction,
                },
                fees: {
                    relayer_fee: BigInt(quote.fees.relayer_fee),
                    protocol_fee: BigInt(quote.fees.protocol_fee),
                },
                send: {
                    mint: quote.send.mint,
                    amount: BigInt(quote.send.amount),
                },
                receive: {
                    mint: quote.receive.mint,
                    amount: BigInt(quote.receive.amount),
                },
                price: {
                    price: quote.price.price,
                    timestamp: BigInt(quote.price.timestamp),
                },
                timestamp: BigInt(quote.timestamp),
            },
            data.signed_quote.signature,
            data.gas_sponsorship_info
                ? {
                      gas_sponsorship_info: {
                          refund_amount: BigInt(
                              data.gas_sponsorship_info.gas_sponsorship_info.refund_amount,
                          ),
                          refund_native_eth:
                              data.gas_sponsorship_info.gas_sponsorship_info.refund_native_eth,
                          refund_address:
                              data.gas_sponsorship_info.gas_sponsorship_info.refund_address,
                      },
                      signature: data.gas_sponsorship_info.signature,
                  }
                : undefined,
        );
    }
}

export interface SettlementTransaction {
    tx_type: string;
    to: string;
    data: string;
    value: string;
}

export interface AtomicMatchApiBundle {
    match_result: ApiExternalMatchResult;
    fees: FeeTake;
    receive: ApiExternalAssetTransfer;
    send: ApiExternalAssetTransfer;
    settlement_tx: SettlementTransaction;
}

export interface ExternalQuoteRequest {
    external_order: ExternalOrder;
}

export interface ExternalQuoteResponse {
    signed_quote: ApiSignedExternalQuote;
    gas_sponsorship_info?: SignedGasSponsorshipInfo;
}

export interface AssembleExternalMatchRequest {
    do_gas_estimation?: boolean;
    allow_shared?: boolean;
    receiver_address?: string;
    signed_quote: ApiSignedExternalQuote;
    updated_order?: ExternalOrder;
}

export interface ExternalMatchRequest {
    do_gas_estimation?: boolean;
    receiver_address?: string;
    external_order: ExternalOrder;
}

export class ExternalMatchResponse {
    match_bundle: AtomicMatchApiBundle;
    gas_sponsored: boolean;
    gas_sponsorship_info?: GasSponsorshipInfo;

    constructor(
        match_bundle: AtomicMatchApiBundle,
        gas_sponsored: boolean,
        gas_sponsorship_info?: GasSponsorshipInfo,
    ) {
        this.match_bundle = match_bundle;
        this.gas_sponsored = gas_sponsored;
        this.gas_sponsorship_info = gas_sponsorship_info;
    }

    static deserialize(data: any): ExternalMatchResponse {
        return new ExternalMatchResponse(
            {
                match_result: {
                    quote_mint: data.match_bundle.match_result.quote_mint,
                    base_mint: data.match_bundle.match_result.base_mint,
                    quote_amount: BigInt(data.match_bundle.match_result.quote_amount),
                    base_amount: BigInt(data.match_bundle.match_result.base_amount),
                    direction: data.match_bundle.match_result.direction,
                },
                fees: {
                    relayer_fee: BigInt(data.match_bundle.fees.relayer_fee),
                    protocol_fee: BigInt(data.match_bundle.fees.protocol_fee),
                },
                receive: {
                    mint: data.match_bundle.receive.mint,
                    amount: BigInt(data.match_bundle.receive.amount),
                },
                send: {
                    mint: data.match_bundle.send.mint,
                    amount: BigInt(data.match_bundle.send.amount),
                },
                settlement_tx: data.match_bundle.settlement_tx,
            },
            data.gas_sponsored,
            data.gas_sponsorship_info
                ? {
                      refund_amount: BigInt(data.gas_sponsorship_info.refund_amount),
                      refund_native_eth: data.gas_sponsorship_info.refund_native_eth,
                      refund_address: data.gas_sponsorship_info.refund_address,
                  }
                : undefined,
        );
    }
}

export interface DepthSideInfo {
    total_quantity: bigint;
    total_quantity_usd: number;
}

export class OrderBookDepth {
    price: number;
    timestamp: number;
    buy: DepthSideInfo;
    sell: DepthSideInfo;

    constructor(price: number, timestamp: number, buy: DepthSideInfo, sell: DepthSideInfo) {
        this.price = price;
        this.timestamp = timestamp;
        this.buy = buy;
        this.sell = sell;
    }

    static deserialize(data: any): OrderBookDepth {
        return new OrderBookDepth(
            Number(data.price),
            Number(data.timestamp),
            {
                total_quantity: BigInt(data.buy.total_quantity),
                total_quantity_usd: Number(data.buy.total_quantity_usd),
            },
            {
                total_quantity: BigInt(data.sell.total_quantity),
                total_quantity_usd: Number(data.sell.total_quantity_usd),
            },
        );
    }
}

export interface ApiToken {
    address: string;
    symbol: string;
}

export interface SupportedTokensResponse {
    tokens: ApiToken[];
}

export interface TokenPrice {
    base_token: string;
    quote_token: string;
    price: number;
}

export interface TokenPricesResponse {
    token_prices: TokenPrice[];
}

export * from "./malleableMatch.js";
