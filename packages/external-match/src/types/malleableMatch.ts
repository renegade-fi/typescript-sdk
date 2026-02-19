import { bytesToHex, concatBytes, hexToBytes, numberToBytes, numberToHex } from "viem/utils";
import { FixedPoint } from "./fixedPoint.js";
import type {
    ApiExternalAssetTransfer,
    FeeTakeRate,
    GasSponsorshipInfo,
    SettlementTransaction,
} from "./index.js";

/** The length of an amount in the calldata, which is 32 bytes for a `uint256` */
const AMOUNT_CALLDATA_LENGTH = 32;
/**
 * The offset of the input amount in the calldata,
 * which is `4` because it's the first calldata argument
 * after the 4-byte function selector
 */
const INPUT_AMOUNT_OFFSET = 4;
/** The address used to represent the native asset */
const NATIVE_ASSET_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * The response type for requesting a malleable match on an external order (v2)
 */
export class MalleableExternalMatchResponse {
    /**
     * The match bundle
     */
    match_bundle: MalleableAtomicMatchApiBundle;
    /**
     * The input amount chosen for the match
     *
     * If `undefined`, the input amount hasn't been selected and defaults to
     * the order's maximum input amount.
     *
     * This field is not meant for client use directly, rather it is set by
     * operating on the type and allows the response type to stay internally
     * consistent
     */
    input_amount?: bigint;
    /**
     * The gas sponsorship info, if the match was sponsored
     */
    gas_sponsorship_info?: GasSponsorshipInfo;

    constructor(
        match_bundle: MalleableAtomicMatchApiBundle,
        gas_sponsorship_info?: GasSponsorshipInfo,
        input_amount?: bigint,
    ) {
        this.match_bundle = match_bundle;
        this.gas_sponsorship_info = gas_sponsorship_info;
        this.input_amount = input_amount;
    }

    static deserialize(data: any): MalleableExternalMatchResponse {
        const matchBundle: MalleableAtomicMatchApiBundle = {
            match_result: {
                input_mint: data.match_bundle.match_result.input_mint,
                output_mint: data.match_bundle.match_result.output_mint,
                price_fp: data.match_bundle.match_result.price_fp,
                min_input_amount: BigInt(data.match_bundle.match_result.min_input_amount),
                max_input_amount: BigInt(data.match_bundle.match_result.max_input_amount),
            },
            fee_rates: data.match_bundle.fee_rates,
            max_receive: {
                mint: data.match_bundle.max_receive.mint,
                amount: BigInt(data.match_bundle.max_receive.amount),
            },
            min_receive: {
                mint: data.match_bundle.min_receive.mint,
                amount: BigInt(data.match_bundle.min_receive.amount),
            },
            max_send: {
                mint: data.match_bundle.max_send.mint,
                amount: BigInt(data.match_bundle.max_send.amount),
            },
            min_send: {
                mint: data.match_bundle.min_send.mint,
                amount: BigInt(data.match_bundle.min_send.amount),
            },
            settlement_tx: {
                tx_type:
                    data.match_bundle.settlement_tx.type ??
                    data.match_bundle.settlement_tx.tx_type ??
                    "0x0",
                to: data.match_bundle.settlement_tx.to,
                data: data.match_bundle.settlement_tx.input ?? data.match_bundle.settlement_tx.data,
                value: data.match_bundle.settlement_tx.value ?? "0x0",
                gas: data.match_bundle.settlement_tx.gas,
            },
            deadline: Number(data.match_bundle.deadline),
        };

        return new MalleableExternalMatchResponse(
            matchBundle,
            data.gas_sponsorship_info
                ? {
                      refund_amount: BigInt(data.gas_sponsorship_info.refund_amount),
                      refund_native_eth: data.gas_sponsorship_info.refund_native_eth,
                      refund_address: data.gas_sponsorship_info.refund_address,
                  }
                : undefined,
            data.input_amount != null ? BigInt(data.input_amount) : undefined,
        );
    }

    /**
     * Get a copy of the settlement transaction
     */
    public settlementTx(): SettlementTransaction {
        return { ...this.match_bundle.settlement_tx };
    }

    /**
     * Set the input amount of the match result
     *
     * @returns The receive amount (output net of fees) at the given input amount
     */
    public setInputAmount(inputAmount: bigint): bigint {
        this.checkInputAmount(inputAmount);

        // Set the calldata
        this.setInputAmountCalldata(inputAmount);

        // Set the input amount on the response
        this.input_amount = inputAmount;

        return this.receiveAmount();
    }

    /**
     * Get the bounds on the input amount
     *
     * Returns an array [min, max] inclusive
     */
    public inputBounds(): [bigint, bigint] {
        return [
            this.match_bundle.match_result.min_input_amount,
            this.match_bundle.match_result.max_input_amount,
        ];
    }

    /**
     * Get the bounds on the output amount
     *
     * Returns an array [min, max] inclusive
     */
    public outputBounds(): [bigint, bigint] {
        const [minInput, maxInput] = this.inputBounds();
        const price = this.getPriceFp();

        const minOutput = price.floorMulInt(minInput);
        const maxOutput = price.floorMulInt(maxInput);

        return [minOutput, maxOutput];
    }

    /**
     * Get the receive amount at the currently set input amount
     */
    public receiveAmount(): bigint {
        return this.computeReceiveAmount(this.currentInputAmount());
    }

    /**
     * Get the receive amount at the given input amount
     */
    public receiveAmountAtInput(inputAmount: bigint): bigint {
        return this.computeReceiveAmount(inputAmount);
    }

    /**
     * Get the send amount at the currently set input amount
     */
    public sendAmount(): bigint {
        return this.currentInputAmount();
    }

    /**
     * Return whether the trade is a native ETH sell (input token is native ETH)
     */
    public isNativeEthSell(): boolean {
        return (
            this.match_bundle.match_result.input_mint.toLowerCase() ===
            NATIVE_ASSET_ADDR.toLowerCase()
        );
    }

    /**
     * Set the calldata to use a given input amount
     */
    private setInputAmountCalldata(inputAmount: bigint) {
        const calldataBytes = hexToBytes(this.match_bundle.settlement_tx.data as `0x${string}`);

        // Padded to 32 bytes
        const inputAmountBytes = numberToBytes(inputAmount, { size: AMOUNT_CALLDATA_LENGTH });

        const prefix = calldataBytes.slice(0, INPUT_AMOUNT_OFFSET);
        const suffix = calldataBytes.slice(
            INPUT_AMOUNT_OFFSET + AMOUNT_CALLDATA_LENGTH,
            calldataBytes.length,
        );

        const newCalldataBytes = concatBytes([prefix, inputAmountBytes, suffix]);
        const newCalldata = bytesToHex(newCalldataBytes);

        // If the trade is a native ETH sell, set the tx value to the input amount
        const value = this.isNativeEthSell() ? inputAmount : 0n;
        const valueHex = numberToHex(value);

        this.match_bundle = {
            ...this.match_bundle,
            settlement_tx: {
                ...this.match_bundle.settlement_tx,
                data: newCalldata,
                value: valueHex,
            },
        };
    }

    /**
     * Check an input amount is in the valid range
     */
    private checkInputAmount(inputAmount: bigint) {
        const [min, max] = this.inputBounds();

        if (inputAmount < min || inputAmount > max) {
            throw new Error(
                `Input amount ${inputAmount} is not in the valid range ${min} - ${max}`,
            );
        }
    }

    /**
     * Get the output amount at the given input amount
     */
    private outputAmount(inputAmount: bigint): bigint {
        return this.getPriceFp().floorMulInt(inputAmount);
    }

    /**
     * Compute the receive amount (output net of fees) at the given input amount
     */
    private computeReceiveAmount(inputAmount: bigint): bigint {
        let preSponsoredAmount = this.outputAmount(inputAmount);

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
     * Get the current input amount
     */
    private currentInputAmount(): bigint {
        if (this.input_amount != null) {
            return this.input_amount;
        }
        return this.match_bundle.match_result.max_input_amount;
    }

    private getPriceFp(): FixedPoint {
        return new FixedPoint(BigInt(this.match_bundle.match_result.price_fp));
    }
}

/**
 * A bounded match result (v2, input/output terminology)
 */
interface ApiBoundedMatchResultV2 {
    /** The mint of the input token */
    input_mint: string;
    /** The mint of the output token */
    output_mint: string;
    /** The price at which the match executes (output per input, fixed point) */
    price_fp: string;
    /** The minimum input amount of the match */
    min_input_amount: bigint;
    /** The maximum input amount of the match */
    max_input_amount: bigint;
}

/**
 * An atomic match settlement bundle using a malleable match result (v2)
 *
 * A malleable match result is one in which the exact `input_amount` swapped
 * is not known at the time the proof is generated, and may be changed up until
 * it is submitted on-chain. Instead, a bounded match result gives a
 * `min_input_amount` and a `max_input_amount`, between which the
 * `input_amount` may take any value
 */
interface MalleableAtomicMatchApiBundle {
    /** The match result */
    match_result: ApiBoundedMatchResultV2;
    /** The fees owed by the external party */
    fee_rates: FeeTakeRate;
    /** The maximum amount that the external party will receive */
    max_receive: ApiExternalAssetTransfer;
    /** The minimum amount that the external party will receive */
    min_receive: ApiExternalAssetTransfer;
    /** The maximum amount that the external party will send */
    max_send: ApiExternalAssetTransfer;
    /** The minimum amount that the external party will send */
    min_send: ApiExternalAssetTransfer;
    /** The transaction which settles the match on-chain */
    settlement_tx: SettlementTransaction;
    /** The deadline of the match */
    deadline: number;
}
