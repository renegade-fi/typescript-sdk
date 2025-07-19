import { z } from "zod";
export const SubscriptionsAckSchema = z.object({
    subscriptions: z.array(z.string()),
});
export type SubscriptionsAck = z.infer<typeof SubscriptionsAckSchema>;
