import z from "zod/v4";
import { type OrderMetadataWsMessage, OrderMetadataWsMessageSchema } from "./order.js";
import { type SubscriptionsAck, SubscriptionsAckSchema } from "./subscriptions.js";

export const RenegadeWsMessageSchema = z.union([
    SubscriptionsAckSchema,
    OrderMetadataWsMessageSchema,
]);
export type RenegadeWsMessage = SubscriptionsAck | OrderMetadataWsMessage;

export { type OrderMetadataWsMessage, OrderMetadataWsMessageSchema } from "./order.js";
export { type SubscriptionsAck, SubscriptionsAckSchema } from "./subscriptions.js";
