export type FeeTake = {
    /// The fee the relayer takes
    relayer_fee: bigint;
    /// The fee the protocol takes
    protocol_fee: bigint;
};

export interface FeeTakeRate {
    relayer_fee_rate: string;
    protocol_fee_rate: string;
}

export type TimestampedPrice = {
    /// The price of the token, represented as a string to avoid floating point precision issues
    price: string;
    timestamp: bigint;
};
