import { z } from "zod";
import { OrderMetadataSchema } from "../order/schema.js";

export const OrderMetadataWsMessage = z.object({
    topic: z.string(), // e.g. "/v0/wallet/.../order-status"
    event: z.object({
        type: z.literal("OrderMetadataUpdated"),
        order: OrderMetadataSchema,
    }),
});

export type OrderMetadataWsMessage = z.infer<typeof OrderMetadataWsMessage>;
