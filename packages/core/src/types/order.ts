export type Order = {
    id: string;
    quote_mint: `0x${string}`;
    base_mint: `0x${string}`;
    side: "Buy" | "Sell";
    type: string;
    worst_case_price: string;
    amount: bigint;
    min_fill_size: bigint;
    allow_external_matches: boolean;
};

export enum OrderState {
    Created = "Created",
    Matching = "Matching",
    SettlingMatch = "SettlingMatch",
    Filled = "Filled",
    Cancelled = "Cancelled",
}

export type OrderMetadata = {
    id: string;
    state: OrderState;
    fills: PartialOrderFill[];
    created: bigint;
    data: Order;
};

export type PartialOrderFill = {
    // The amount filled by the partial fill
    amount: bigint;
    // The price at which the fill executed
    price: TimestampedPrice;
};

export type TimestampedPrice = {
    // The price
    price: number;
    // The time the price was sampled, in milliseconds since the epoch
    timestamp: bigint;
};

export type AdminOrderMetadata = {
    order: OrderMetadata;
    wallet_id: string;
    fillable?: bigint;
    price?: number;
};
