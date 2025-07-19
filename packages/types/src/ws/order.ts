import { z } from "zod";
import { OrderMetadataSchema } from "../order/schema.js";

export const OrderMetadataWsMessageSchema = z.object({
    topic: z.string(),
    event: z.object({
        type: z.literal("OrderMetadataUpdated"),
        order: OrderMetadataSchema,
    }),
});
export type OrderMetadataWsMessage = z.infer<typeof OrderMetadataWsMessageSchema>;
