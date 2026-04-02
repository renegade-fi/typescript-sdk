import { describe, expect, it } from "vitest";
import { createClient, ensureAccount, USDC, WETH } from "./helpers.js";

describe("placeOrder and getOrder", () => {
    it("places an order and fetches it by ID", { timeout: 30_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        await client.placeOrder({
            inputMint: USDC,
            outputMint: WETH,
            inputAmount: 100_000n,
        });

        // Find the placed order via getOrders
        const orders = await client.getOrders(false);
        expect(orders.length).toBeGreaterThan(0);

        const placed = orders.find(
            (o) =>
                o.order.intent.in_token.toLowerCase() === USDC.toLowerCase() &&
                o.order.intent.out_token.toLowerCase() === WETH.toLowerCase(),
        );
        expect(placed).toBeDefined();

        // Fetch the same order by ID
        const order = await client.getOrder(placed!.id);
        expect(order.id).toBe(placed!.id);
        expect(order.state).toBe("created");

        // Clean up
        await client.cancelOrder(placed!.id);
    });
});
