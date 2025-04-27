export type FeeTake = {
    /// The fee the relayer takes
    relayer_fee: bigint;
    /// The fee the protocol takes
    protocol_fee: bigint;
};

export type TimestampedPrice = {
    /// The price of the token, represented as a string to avoid floating point precision issues
    price: string;
    timestamp: bigint;
};
