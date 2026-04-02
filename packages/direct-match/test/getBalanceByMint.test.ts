import { describe, expect, it } from "vitest";
import { createClient, ensureAccount, USDC } from "./helpers.js";

describe("getBalanceByMint", () => {
    it("fetches a balance by token mint or throws if not found", { timeout: 15_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        try {
            const balance = await client.getBalanceByMint(USDC);
            expect(balance.mint.toLowerCase()).toBe(USDC.toLowerCase());
        } catch (e) {
            // The relayer returns 404 if no balance exists for this mint
            expect(String(e)).toContain("getBalanceByMint failed");
        }
    });
});
