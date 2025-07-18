import { z } from "zod";
import { OrderMetadataWsMessage } from "./order.js";

/**
 * Union of all incoming WS message shapes,
 * discriminated on event.type
 */
export const RenegadeWsMessage = z.discriminatedUnion("event.type", [OrderMetadataWsMessage]);

export type RenegadeWsMessage = z.infer<typeof RenegadeWsMessage>;
