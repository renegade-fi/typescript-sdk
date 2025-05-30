/** The number of bits to use for the fixed point precision */
const FIXED_POINT_PRECISION_BITS = 63;

/** `bigint` representing the fixed point precision shift value */
const FIXED_POINT_PRECISION_SHIFT = BigInt(2) ** BigInt(FIXED_POINT_PRECISION_BITS);

export class FixedPoint {
    readonly value: bigint;

    constructor(value: bigint) {
        this.value = value;
    }

    /**
     * Multiply a fixed point number by a bigint and return the floor
     */
    floorMulInt(amount: bigint): bigint {
        const product = this.value * amount;
        // BigInt division automatically floors for positive numbers
        const floored = product / FIXED_POINT_PRECISION_SHIFT;
        return floored;
    }

    /**
     * Divide a bigint by a fixed point number and return the ceiling
     */
    static ceilDivInt(amount: bigint, fp: FixedPoint): bigint {
        const numerator = amount * FIXED_POINT_PRECISION_SHIFT;
        const quotient = numerator / fp.value;
        const remainder = numerator % fp.value;

        if (remainder === BigInt(0)) {
            return quotient;
        }

        return quotient + BigInt(1);
    }
}
