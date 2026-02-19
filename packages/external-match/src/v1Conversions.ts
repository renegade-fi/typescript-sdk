/**
 * Conversion functions between v1 and v2 external match types.
 *
 * Ported from Rust SDK's v1_conversions.rs.
 */

import { hexToBytes } from "viem/utils";
import { FixedPoint } from "./types/fixedPoint.js";
import {
    type ApiExternalAssetTransfer,
    type ApiExternalMatchResult,
    type ApiExternalQuote,
    type ApiTimestampedPrice,
    type DepthSideInfo,
    ExternalMatchResponse,
    type ExternalOrder,
    type FeeTake,
    type GasSponsorshipInfo,
    GetDepthForAllPairsResponse,
    OrderBookDepth,
    OrderSide,
    SignedExternalQuote,
    type SupportedTokensResponse,
    type TokenPricesResponse,
} from "./types/index.js";
import type {
    ApiSignedQuoteV2,
    ExternalMatchResponseV2,
    ExternalOrderV2,
    ExternalQuoteResponseV2,
    GetMarketDepthByMintResponse,
    GetMarketDepthsResponse,
    GetMarketsResponse,
    MarketDepth,
} from "./types/v2Types.js";

/** The offset of the input amount in the calldata, after the 4-byte function selector */
const INPUT_AMOUNT_OFFSET = 4;
/** The length of an amount in calldata (32 bytes for a `uint256`) */
const AMOUNT_CALLDATA_LENGTH = 32;

// -------------------------
// | ExternalOrder v1 → v2 |
// -------------------------

export function v1OrderToV2(order: ExternalOrder): ExternalOrderV2 {
    if (order.side === OrderSide.BUY) {
        // Buy: input=quote, output=base
        let input_amount = 0n;
        let output_amount = 0n;
        let use_exact_output_amount = false;

        if (order.quote_amount != null && order.quote_amount !== 0n) {
            input_amount = order.quote_amount;
        } else if (order.base_amount != null && order.base_amount !== 0n) {
            output_amount = order.base_amount;
        } else if (order.exact_base_output != null && order.exact_base_output !== 0n) {
            output_amount = order.exact_base_output;
            use_exact_output_amount = true;
        } else if (order.exact_quote_output != null && order.exact_quote_output !== 0n) {
            input_amount = order.exact_quote_output;
            use_exact_output_amount = true;
        }

        return {
            input_mint: order.quote_mint,
            output_mint: order.base_mint,
            input_amount,
            output_amount,
            use_exact_output_amount,
            min_fill_size: order.min_fill_size ?? 0n,
        };
    }

    // Sell: input=base, output=quote
    let input_amount = 0n;
    let output_amount = 0n;
    let use_exact_output_amount = false;

    if (order.base_amount != null && order.base_amount !== 0n) {
        input_amount = order.base_amount;
    } else if (order.quote_amount != null && order.quote_amount !== 0n) {
        output_amount = order.quote_amount;
    } else if (order.exact_quote_output != null && order.exact_quote_output !== 0n) {
        output_amount = order.exact_quote_output;
        use_exact_output_amount = true;
    } else if (order.exact_base_output != null && order.exact_base_output !== 0n) {
        input_amount = order.exact_base_output;
        use_exact_output_amount = true;
    }

    return {
        input_mint: order.base_mint,
        output_mint: order.quote_mint,
        input_amount,
        output_amount,
        use_exact_output_amount,
        min_fill_size: order.min_fill_size ?? 0n,
    };
}

// --------------------------------------------------
// | SignedExternalQuoteV2 → v1 SignedExternalQuote |
// --------------------------------------------------

function invertPriceString(priceStr: string): string {
    const price = Number.parseFloat(priceStr);
    if (Number.isNaN(price) || price === 0) {
        return "0";
    }
    return (1.0 / price).toString();
}

export function v2QuoteToV1(
    v2Response: ExternalQuoteResponseV2,
    originalOrder: ExternalOrder,
): SignedExternalQuote {
    const v2Quote = v2Response.signed_quote.quote;
    const direction = originalOrder.side;

    // Map v2 input/output to v1 base/quote based on direction
    let quote_mint: string;
    let base_mint: string;
    let quote_amount: bigint;
    let base_amount: bigint;

    if (direction === OrderSide.BUY) {
        // Buy: input=quote, output=base
        quote_mint = v2Quote.match_result.input_mint;
        base_mint = v2Quote.match_result.output_mint;
        quote_amount = v2Quote.match_result.input_amount;
        base_amount = v2Quote.match_result.output_amount;
    } else {
        // Sell: input=base, output=quote
        quote_mint = v2Quote.match_result.output_mint;
        base_mint = v2Quote.match_result.input_mint;
        quote_amount = v2Quote.match_result.output_amount;
        base_amount = v2Quote.match_result.input_amount;
    }

    const v1MatchResult: ApiExternalMatchResult = {
        quote_mint,
        base_mint,
        quote_amount,
        base_amount,
        direction,
    };

    // Convert the price from v2's output/input to v1's quote/base
    // For Sell: output=quote, input=base → output/input = quote/base ✓
    // For Buy: output=base, input=quote → invert to get quote/base
    const v1Price: ApiTimestampedPrice =
        direction === OrderSide.BUY
            ? {
                  price: invertPriceString(v2Quote.price.price),
                  timestamp: BigInt(v2Quote.price.timestamp),
              }
            : { price: v2Quote.price.price, timestamp: BigInt(v2Quote.price.timestamp) };

    const v1Quote: ApiExternalQuote = {
        order: originalOrder,
        match_result: v1MatchResult,
        fees: v2Quote.fees,
        send: v2Quote.send,
        receive: v2Quote.receive,
        price: v1Price,
        timestamp: BigInt(v2Quote.timestamp),
    };

    // Build v1 gas sponsorship info (no signature in v2)
    const gasSponsorshipInfo = v2Response.gas_sponsorship_info
        ? { gas_sponsorship_info: v2Response.gas_sponsorship_info }
        : undefined;

    // Store the original v2 ApiSignedQuote for round-tripping
    const innerV2Quote: ApiSignedQuoteV2 = v2Response.signed_quote;

    return new SignedExternalQuote(
        v1Quote,
        v2Response.signed_quote.signature,
        BigInt(v2Response.signed_quote.deadline),
        gasSponsorshipInfo,
        innerV2Quote,
    );
}

// --------------------------------------------------
// | v1 SignedExternalQuote → v2 for round-tripping |
// --------------------------------------------------

export function v1QuoteToV2(v1Quote: SignedExternalQuote): ApiSignedQuoteV2 {
    if (!v1Quote._innerV2Quote) {
        throw new Error(
            "Cannot convert v1 quote to v2: missing inner v2 quote. " +
                "This quote was not created from a v2 response.",
        );
    }
    return v1Quote._innerV2Quote;
}

// ----------------------------------------------
// | ExternalMatchResponseV2 → v1 Non-Malleable |
// ----------------------------------------------

function decodeInputAmountFromCalldata(settlementTxData: string): bigint {
    const data = hexToBytes(settlementTxData as `0x${string}`);
    const end = INPUT_AMOUNT_OFFSET + AMOUNT_CALLDATA_LENGTH;

    if (data.length < end) {
        throw new Error("Invalid calldata: too short to decode input amount");
    }

    const inputSlice = data.slice(INPUT_AMOUNT_OFFSET, end);

    // Decode big-endian uint256 → bigint
    let value = 0n;
    for (const byte of inputSlice) {
        value = (value << 8n) | BigInt(byte);
    }
    return value;
}

export function v2ResponseToV1NonMalleable(
    v2Resp: ExternalMatchResponseV2,
    direction: OrderSide,
): ExternalMatchResponse {
    const matchResult = v2Resp.match_bundle.match_result;
    const priceFp = new FixedPoint(BigInt(matchResult.price_fp));

    // Decode input amount from calldata
    const inputAmount = decodeInputAmountFromCalldata(v2Resp.match_bundle.settlement_tx.data);
    const outputAmount = priceFp.floorMulInt(inputAmount);

    // Map v2 input/output to v1 base/quote based on direction
    let quote_mint: string;
    let base_mint: string;
    let quote_amount: bigint;
    let base_amount: bigint;

    if (direction === OrderSide.BUY) {
        // Buy: input=quote, output=base
        quote_mint = matchResult.input_mint;
        base_mint = matchResult.output_mint;
        quote_amount = inputAmount;
        base_amount = outputAmount;
    } else {
        // Sell: input=base, output=quote
        quote_mint = matchResult.output_mint;
        base_mint = matchResult.input_mint;
        quote_amount = outputAmount;
        base_amount = inputAmount;
    }

    const v1MatchResult: ApiExternalMatchResult = {
        quote_mint,
        base_mint,
        quote_amount,
        base_amount,
        direction,
    };

    // Compute fees from fee_rates and output amount
    const relayerFeeRate = new FixedPoint(BigInt(v2Resp.match_bundle.fee_rates.relayer_fee_rate));
    const protocolFeeRate = new FixedPoint(BigInt(v2Resp.match_bundle.fee_rates.protocol_fee_rate));
    const totalFeeRate = new FixedPoint(relayerFeeRate.value + protocolFeeRate.value);

    const totalFee = totalFeeRate.floorMulInt(outputAmount);
    const relayerFee = relayerFeeRate.floorMulInt(outputAmount);
    const protocolFee = totalFee - relayerFee;

    const fees: FeeTake = { relayer_fee: relayerFee, protocol_fee: protocolFee };

    // Compute receive/send from direction
    // The receive token is the output token; fees are subtracted from receive
    let receive: ApiExternalAssetTransfer;
    let send: ApiExternalAssetTransfer;

    if (direction === OrderSide.BUY) {
        receive = { mint: base_mint, amount: base_amount - totalFee };
        send = { mint: quote_mint, amount: quote_amount };
    } else {
        receive = { mint: quote_mint, amount: quote_amount - totalFee };
        send = { mint: base_mint, amount: base_amount };
    }

    const gasSponsored = v2Resp.gas_sponsorship_info != null;
    const gasSponsorshipInfo: GasSponsorshipInfo | undefined =
        v2Resp.gas_sponsorship_info ?? undefined;

    return new ExternalMatchResponse(
        {
            match_result: v1MatchResult,
            fees,
            receive,
            send,
            settlement_tx: v2Resp.match_bundle.settlement_tx,
            deadline: BigInt(v2Resp.match_bundle.deadline),
        },
        gasSponsored,
        gasSponsorshipInfo,
    );
}

// -------------------------------
// | Market response conversions |
// -------------------------------

export function marketsToSupportedTokens(resp: GetMarketsResponse): SupportedTokensResponse {
    const seen = new Set<string>();
    const tokens: { address: string; symbol: string }[] = [];

    for (const market of resp.markets) {
        if (!seen.has(market.base.address)) {
            seen.add(market.base.address);
            tokens.push(market.base);
        }
        if (!seen.has(market.quote.address)) {
            seen.add(market.quote.address);
            tokens.push(market.quote);
        }
    }

    return { tokens };
}

export function marketsToTokenPrices(resp: GetMarketsResponse): TokenPricesResponse {
    const token_prices = resp.markets.map((m) => ({
        base_token: m.base.address,
        quote_token: m.quote.address,
        price: Number.parseFloat(m.price.price),
    }));
    return { token_prices };
}

function marketDepthToV1Single(depth: MarketDepth): OrderBookDepth {
    const price = Number.parseFloat(depth.market.price.price);
    const relayerFeeRate = new FixedPoint(
        BigInt(depth.market.external_match_fee_rates.relayer_fee_rate),
    );
    const protocolFeeRate = new FixedPoint(
        BigInt(depth.market.external_match_fee_rates.protocol_fee_rate),
    );

    const buy: DepthSideInfo = {
        total_quantity: depth.buy.total_quantity,
        total_quantity_usd: depth.buy.total_quantity_usd,
    };
    const sell: DepthSideInfo = {
        total_quantity: depth.sell.total_quantity,
        total_quantity_usd: depth.sell.total_quantity_usd,
    };

    return new OrderBookDepth(
        depth.market.base.address,
        price,
        depth.market.price.timestamp,
        buy,
        sell,
        {
            relayer_fee_rate: relayerFeeRate.toF64(),
            protocol_fee_rate: protocolFeeRate.toF64(),
        },
    );
}

export function marketDepthToV1(resp: GetMarketDepthByMintResponse): OrderBookDepth {
    return marketDepthToV1Single(resp.market_depth);
}

export function marketDepthsToV1(resp: GetMarketDepthsResponse): GetDepthForAllPairsResponse {
    return new GetDepthForAllPairsResponse(resp.market_depths.map(marketDepthToV1Single));
}
