import { bytesToHex, concatBytes, hexToBytes, numberToBytes, numberToHex } from "viem/utils";
import type {
    ExternalAssetTransfer,
    ExternalSettlementTx,
    GasSponsorshipInfo,
} from "./externalMatch.js";
import { FixedPoint } from "./fixedPoint.js";
import type { FeeTakeRate } from "./match.js";
import { OrderSide, type OrderSideType } from "./order.js";

/** The length of an amount in the calldata, which is 32 bytes for a `uint256` */
const AMOUNT_CALLDATA_LENGTH = 32;
/**
 * The offset of the quote amount in the calldata,
 * which is `4` because it's the first calldata argument
 * after the 4-byte function selector
 */
const QUOTE_AMOUNT_OFFSET = 4;
/**
 * The offset of the base amount in the calldata,
 * which is `AMOUNT_CALLDATA_LENGTH` bytes after
 * the quote amount as it is the next calldata argument
 */
const BASE_AMOUNT_OFFSET = QUOTE_AMOUNT_OFFSET + AMOUNT_CALLDATA_LENGTH;
/** The address used to represent the native asset */
const NATIVE_ASSET_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * The response type for requesting a malleable quote on an external order
 */
export class MalleableExternalMatchResponse {
    /**
     * The match bundle
     */
    match_bundle: MalleableAtomicMatchApiBundle;
    /**
     * The base amount chosen for the match
     *
     * If `undefined`, the base amount hasn't been selected and defaults to the order's maximum base amount.
     *
     * This field is not meant for client use directly, rather it is set by
     * operating on the type and allows the response type to stay internally
     * consistent
     */
    base_amount?: bigint;
    /**
     * The quote amount chosen for the match
     *
     * If `undefined`, the quote amount hasn't been selected and defaults to the
     * quote amount implied by the maximum base amount and the price in the match result.
     *
     * This field is not meant for client use directly, rather it is set by
     * operating on the type and allows the response type to stay internally
     * consistent
     */
    quote_amount?: bigint;
    /**
     * Whether the match was sponsored
     */
    gas_sponsored: boolean;
    /**
     * The gas sponsorship info, if the match was sponsored
     */
    gas_sponsorship_info?: GasSponsorshipInfo;

    constructor(
        match_bundle: MalleableAtomicMatchApiBundle,
        gas_sponsored: boolean,
        gas_sponsorship_info?: GasSponsorshipInfo,
        base_amount?: bigint,
        quote_amount?: bigint,
    ) {
        this.match_bundle = match_bundle;
        this.gas_sponsored = gas_sponsored;
        this.gas_sponsorship_info = gas_sponsorship_info;
        this.base_amount = base_amount;
        this.quote_amount = quote_amount;
    }

    /**
     * Set the `base_amount` of the `match_result`
     *
     * @returns The amount received at the given `base_amount`
     */
    public setBaseAmount(baseAmount: bigint) {
        this.checkBaseAmount(baseAmount);

        const impliedQuoteAmount = this.quoteAmount(baseAmount);

        // Set the calldata
        this.setBaseAmountCalldata(baseAmount);
        this.setQuoteAmountCalldata(impliedQuoteAmount);

        // Set the quote and base amounts on the response
        this.base_amount = baseAmount;
        this.quote_amount = impliedQuoteAmount;

        return this.receiveAmount();
    }

    /**
     * Set the `quote_amount` of the `match_result`
     *
     * @returns The amount received at the given `quote_amount`
     */
    public setQuoteAmount(quoteAmount: bigint) {
        const impliedBaseAmount = this.baseAmount(quoteAmount);
        this.checkQuoteAmount(quoteAmount, impliedBaseAmount);

        // Set the calldata
        this.setQuoteAmountCalldata(quoteAmount);
        this.setBaseAmountCalldata(impliedBaseAmount);

        // Set the quote and base amounts on the response
        this.quote_amount = quoteAmount;
        this.base_amount = impliedBaseAmount;

        return this.receiveAmount();
    }

    /**
     * Get the bounds on the base amount
     *
     * Returns an array [min, max] inclusive
     */
    public baseBounds(): [bigint, bigint] {
        return [
            this.match_bundle.match_result.min_base_amount,
            this.match_bundle.match_result.max_base_amount,
        ];
    }

    /**
     * Get the bounds on the quote amount
     *
     * Returns an array [min, max] inclusive
     */
    public quoteBounds(): [bigint, bigint] {
        const [minBase, maxBase] = this.baseBounds();
        const price = this.getPriceFp();

        const minQuote = price.floorMulInt(minBase);
        const maxQuote = price.floorMulInt(maxBase);

        return [minQuote, maxQuote];
    }

    /**
     * Get the bounds on the quote amount for a given base amount.
     *
     * For an explanation of these bounds, see:
     * https://github.com/renegade-fi/renegade-contracts/blob/main/contracts-common/src/types/match.rs#L144-L174
     */
    public quoteBoundsForBase(baseAmount: bigint): [bigint, bigint] {
        const [minQuote, maxQuote] = this.quoteBounds();

        const price = this.getPriceFp();
        const refQuote = price.floorMulInt(baseAmount);

        const direction = this.match_bundle.match_result.direction;

        const resolvedMinQuote = direction === OrderSide.BUY ? refQuote : minQuote;
        const resolvedMaxQuote = direction === OrderSide.BUY ? maxQuote : refQuote;

        return [resolvedMinQuote, resolvedMaxQuote];
    }

    /**
     * Get the receive amount at the currently set base amount
     */
    public receiveAmount() {
        return this.computeReceiveAmount(this.currentBaseAmount());
    }

    /**
     * Get the receive amount at the given base amount
     */
    public receiveAmountAtBase(baseAmount: bigint) {
        return this.computeReceiveAmount(baseAmount);
    }

    /**
     * Get the receive amount at the given quote amount
     */
    public receiveAmountAtQuote(quoteAmount: bigint) {
        const baseAmount = this.baseAmount(quoteAmount);
        return this.computeReceiveAmount(baseAmount);
    }

    /**
     * Get the send amount at the currently set base amount
     */
    public sendAmount() {
        return this.computeSendAmount(this.currentBaseAmount());
    }

    /**
     * Get the send amount at the given base amount
     */
    public sendAmountAtBase(baseAmount: bigint) {
        return this.computeSendAmount(baseAmount);
    }

    /**
     * Get the send amount at the given quote amount
     */
    public sendAmountAtQuote(quoteAmount: bigint) {
        const baseAmount = this.baseAmount(quoteAmount);
        return this.computeSendAmount(baseAmount);
    }

    /**
     * Set the calldata to use a given base amount
     */
    private setBaseAmountCalldata(baseAmount: bigint) {
        const calldataBytes = hexToBytes(this.match_bundle.settlement_tx.data as `0x${string}`);

        // Padded to 32 bytes
        const baseAmountBytes = numberToBytes(baseAmount, { size: AMOUNT_CALLDATA_LENGTH });

        const prefix = calldataBytes.slice(0, BASE_AMOUNT_OFFSET);
        const suffix = calldataBytes.slice(
            BASE_AMOUNT_OFFSET + AMOUNT_CALLDATA_LENGTH,
            calldataBytes.length,
        );

        // Set the calldata and the tx value
        const newCalldataBytes = concatBytes([prefix, baseAmountBytes, suffix]);
        const newCalladata = bytesToHex(newCalldataBytes);
        const value = this.isNativeEthSell() ? baseAmount : 0n;
        const valueHex = numberToHex(value);

        const newMatchBundle = {
            ...this.match_bundle,
            settlement_tx: {
                ...this.match_bundle.settlement_tx,
                data: newCalladata,
                value: valueHex,
            },
        };

        this.match_bundle = newMatchBundle;
    }

    /**
     * Set the calldata to use a given quote amount
     */
    private setQuoteAmountCalldata(quoteAmount: bigint) {
        const calldataBytes = hexToBytes(this.match_bundle.settlement_tx.data as `0x${string}`);

        // Padded to 32 bytes
        const quoteAmountBytes = numberToBytes(quoteAmount, { size: AMOUNT_CALLDATA_LENGTH });

        const prefix = calldataBytes.slice(0, QUOTE_AMOUNT_OFFSET);
        const suffix = calldataBytes.slice(
            QUOTE_AMOUNT_OFFSET + AMOUNT_CALLDATA_LENGTH,
            calldataBytes.length,
        );

        // Set the calldata and the tx value
        const newCalldataBytes = concatBytes([prefix, quoteAmountBytes, suffix]);
        const newCalladata = bytesToHex(newCalldataBytes);

        const newMatchBundle = {
            ...this.match_bundle,
            settlement_tx: {
                ...this.match_bundle.settlement_tx,
                data: newCalladata,
            },
        };

        this.match_bundle = newMatchBundle;
    }

    /**
     * Return whether the trade is a native ETH sell
     */
    public isNativeEthSell(): boolean {
        const matchRes = this.match_bundle.match_result;
        const isSell = matchRes.direction === OrderSide.SELL;
        const isBaseEth = matchRes.base_mint.toLowerCase() === NATIVE_ASSET_ADDR.toLowerCase();

        return isBaseEth && isSell;
    }

    /**
     * Check a base amount is in the valid range
     */
    private checkBaseAmount(baseAmount: bigint) {
        const [min, max] = this.baseBounds();

        if (baseAmount < min || baseAmount > max) {
            throw new Error(`Base amount ${baseAmount} is not in the valid range ${min} - ${max}`);
        }
    }

    /**
     * Check a quote amount is in the valid range for a given base amount.
     *
     * This is true if the quote amount is within the bounds implied by the min
     * and max base amounts given the price in the match results, and the
     * quote amount does not imply a price improvement over the price in
     * the match result.
     */
    private checkQuoteAmount(quoteAmount: bigint, baseAmount: bigint) {
        const [min, max] = this.quoteBoundsForBase(baseAmount);

        if (quoteAmount < min || quoteAmount > max) {
            throw new Error(
                `Quote amount ${quoteAmount} is not in the valid range ${min} - ${max}`,
            );
        }
    }

    /**
     * Get the current receive amount at the given base amount
     *
     * This is net of fees
     */
    private computeReceiveAmount(baseAmount: bigint) {
        const matchRes = this.match_bundle.match_result;
        let preSponsoredAmount =
            matchRes.direction === OrderSide.BUY ? baseAmount : this.quoteAmount(baseAmount);

        // Account for fees
        const totalFee =
            BigInt(this.match_bundle.fee_rates.protocol_fee_rate) +
            BigInt(this.match_bundle.fee_rates.relayer_fee_rate);
        const totalFeeAmount = new FixedPoint(totalFee).floorMulInt(preSponsoredAmount);
        preSponsoredAmount -= totalFeeAmount;

        // Account for gas sponsorship
        if (this.gas_sponsorship_info && !this.gas_sponsorship_info.refund_native_eth) {
            preSponsoredAmount += this.gas_sponsorship_info.refund_amount;
        }

        return preSponsoredAmount;
    }

    /**
     * Get the current send amount at the given base amount
     */
    private computeSendAmount(baseAmount: bigint) {
        const matchRes = this.match_bundle.match_result;
        if (matchRes.direction === OrderSide.BUY) {
            return this.quoteAmount(baseAmount);
        }
        return baseAmount;
    }

    /**
     * Get the base amount at the given quote amount
     */
    private baseAmount(quoteAmount: bigint) {
        const price = this.getPriceFp();
        return FixedPoint.ceilDivInt(quoteAmount, price);
    }

    /**
     * Get the quote amount at the given base amount
     */
    private quoteAmount(baseAmount: bigint) {
        const price = this.getPriceFp();
        return price.floorMulInt(baseAmount);
    }

    /**
     * Get the current base amount
     */
    private currentBaseAmount() {
        if (!this.base_amount) {
            return this.match_bundle.match_result.max_base_amount;
        }
        return this.base_amount;
    }

    private getPriceFp() {
        return new FixedPoint(BigInt(this.match_bundle.match_result.price_fp));
    }
}

/**
 * A bounded match result
 */
interface ApiBoundedMatchResult {
    /**
     * The mint of the quote token in the matched asset pair
     */
    quote_mint: string;
    /**
     * The mint of the base token in the matched asset pair
     */
    base_mint: string;
    /**
     * The price at which the match executes
     */
    price_fp: string;
    /**
     * The minimum base amount of the match
     */
    min_base_amount: bigint;
    /**
     * The maximum base amount of the match
     */
    max_base_amount: bigint;
    /**
     * The direction of the match
     */
    direction: OrderSideType;
}

/**
 * An atomic match settlement bundle using a malleable match result
 *
 * A malleable match result is one in which the exact `base_amount` swapped
 * is not known at the time the proof is generated, and may be changed up until
 * it is submitted on-chain. Instead, a bounded match result gives a
 * `min_base_amount` and a `max_base_amount`, between which the `base_amount`
 * may take any value
 */
interface MalleableAtomicMatchApiBundle {
    /** The match result */
    match_result: ApiBoundedMatchResult;
    /** The fees owed by the external party */
    fee_rates: FeeTakeRate;
    /** The maximum amount that the external party will receive */
    max_receive: ExternalAssetTransfer;
    /** The minimum amount that the external party will receive */
    min_receive: ExternalAssetTransfer;
    /** The maximum amount that the external party will send */
    max_send: ExternalAssetTransfer;
    /** The minimum amount that the external party will send */
    min_send: ExternalAssetTransfer;
    /** The transaction which settles the match on-chain */
    settlement_tx: ExternalSettlementTx;
}
