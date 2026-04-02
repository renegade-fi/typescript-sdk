import { describe, expect, it } from "vitest";
import { createClient, ensureAccount, USDC, WETH } from "./helpers.js";

describe("getOrders", () => {
    it("returns placed orders", { timeout: 30_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        await client.placeOrder({
            inputMint: USDC,
            outputMint: WETH,
            inputAmount: 100_000n,
        });

        const orders = await client.getOrders(false);
        const found = orders.find(
            (o) => o.order.intent.in_token.toLowerCase() === USDC.toLowerCase(),
        );
        expect(found).toBeDefined();

        // Clean up
        await client.cancelOrder(found!.id);
    });

    it("cancelled orders do not appear in non-historic results", { timeout: 30_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        await client.placeOrder({
            inputMint: USDC,
            outputMint: WETH,
            inputAmount: 100_000n,
        });

        const orders = await client.getOrders(false);
        const found = orders.find(
            (o) => o.order.intent.in_token.toLowerCase() === USDC.toLowerCase(),
        );
        expect(found).toBeDefined();

        await client.cancelOrder(found!.id);

        const after = await client.getOrders(false);
        expect(after.find((o) => o.id === found!.id)).toBeUndefined();
    });
});
