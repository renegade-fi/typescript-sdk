import z from "zod/v4";
import { zHexString } from "../common/index.js";

/**
 * The side of the market a given order is on
 */
export const OrderSideSchema = z.enum(["Buy", "Sell"]);

/**
 * The state of an order in the wallet
 */
export const OrderStateSchema = z.enum([
    "Created",
    "Matching",
    "SettlingMatch",
    "Filled",
    "Cancelled",
]);

/**
 * A price along with the time it was sampled
 */
export const TimestampedPriceSchema = z.object({
    price: z.coerce.number(),
    timestamp: z.coerce.bigint(),
});

/**
 * A partial fill of an order, recording the information parameterizing a match
 */
export const PartialOrderFillSchema = z.object({
    amount: z.coerce.bigint(),
    price: TimestampedPriceSchema,
});

/**
 * Represents the base type of an open order, including the asset pair, the
 * amount, price, and direction
 */
export const OrderSchema = z.object({
    quote_mint: zHexString,
    base_mint: zHexString,
    side: OrderSideSchema,
    worst_case_price: z.string(),
    amount: z.coerce.bigint(),
    min_fill_size: z.coerce.bigint(),
    allow_external_matches: z.boolean(),
});

/**
 * Metadata for an order in a wallet, possibly historical
 */
export const OrderMetadataSchema = z.object({
    id: z.string(),
    state: OrderStateSchema,
    fills: z.array(PartialOrderFillSchema),
    created: z.coerce.bigint(),
    data: OrderSchema,
});

export type OrderSide = z.infer<typeof OrderSideSchema>;
export type OrderState = z.infer<typeof OrderStateSchema>;
export type TimestampedPrice = z.infer<typeof TimestampedPriceSchema>;
export type PartialOrderFill = z.infer<typeof PartialOrderFillSchema>;
export type OrderMetadata = z.infer<typeof OrderMetadataSchema>;
export type Order = z.infer<typeof OrderSchema>;
