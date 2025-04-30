import { bytesToHex, concatBytes, hexToBytes, numberToBytes } from "viem/utils";
import type {
    ExternalAssetTransfer,
    ExternalSettlementTx,
    GasSponsorshipInfo,
} from "./externalMatch.js";
import { FixedPoint } from "./fixedPoint.js";
import type { FeeTakeRate } from "./match.js";
import { OrderSide, type OrderSideType } from "./order.js";

/** The offset of the base amount in the calldata */
const BASE_AMOUNT_OFFSET = 4;
/** The length of the base amount in the calldata */
const BASE_AMOUNT_LENGTH = 32;

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
    ) {
        this.match_bundle = match_bundle;
        this.gas_sponsored = gas_sponsored;
        this.gas_sponsorship_info = gas_sponsorship_info;
        this.base_amount = base_amount;
    }

    /**
     * Set the `base_amount` of the `match_result`
     *
     * @returns The amount received at the given `base_amount`
     */
    public setBaseAmount(baseAmount: bigint) {
        this.checkBaseAmount(baseAmount);

        // Set the calldata
        this.setBaseAmountCalldata(baseAmount);
        this.base_amount = baseAmount;

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
     * Set the calldata to use a given base amount
     */
    private setBaseAmountCalldata(baseAmount: bigint) {
        const calldataBytes = hexToBytes(this.match_bundle.settlement_tx.data as `0x${string}`);

        // Padded to 32 bytes
        const baseAmountBytes = numberToBytes(baseAmount, { size: BASE_AMOUNT_LENGTH });

        const prefix = calldataBytes.slice(0, BASE_AMOUNT_OFFSET);
        const suffix = calldataBytes.slice(
            BASE_AMOUNT_OFFSET + BASE_AMOUNT_LENGTH,
            calldataBytes.length,
        );

        const newCalldataBytes = concatBytes([prefix, baseAmountBytes, suffix]);
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
     * Check a base amount is in the valid range
     */
    private checkBaseAmount(baseAmount: bigint) {
        const min = this.match_bundle.match_result.min_base_amount;
        const max = this.match_bundle.match_result.max_base_amount;

        if (baseAmount < min || baseAmount > max) {
            throw new Error(`Base amount ${baseAmount} is not in the valid range ${min} - ${max}`);
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
     * Get the quote amount at the given base amount
     */
    private quoteAmount(baseAmount: bigint) {
        const price = new FixedPoint(BigInt(this.match_bundle.match_result.price_fp));
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
