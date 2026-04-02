import { describe, expect, it } from "vitest";
import { createClient, ensureAccount, USDC, WETH } from "./helpers.js";

describe("cancelOrder", () => {
    it(
        "cancels a placed order so it no longer appears in active orders",
        { timeout: 30_000 },
        async () => {
            const client = await createClient();
            await ensureAccount(client);

            await client.placeOrder({
                inputMint: USDC,
                outputMint: WETH,
                inputAmount: 100_000n,
            });

            const before = await client.getOrders(false);
            expect(before.length).toBeGreaterThan(0);
            const orderId = before[0]!.id;

            await client.cancelOrder(orderId);

            const after = await client.getOrders(false);
            expect(after.find((o) => o.id === orderId)).toBeUndefined();
        },
    );

    it("fails when cancelling a nonexistent order", { timeout: 15_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        const fakeOrderId = "00000000-0000-0000-0000-000000000000";
        await expect(client.cancelOrder(fakeOrderId)).rejects.toThrow();
    });
});
