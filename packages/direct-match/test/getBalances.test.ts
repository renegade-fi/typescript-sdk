import { describe, expect, it } from "vitest";
import { createClient, ensureAccount } from "./helpers.js";

describe("getBalances", () => {
    it("fetches account balances", { timeout: 15_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        const balances = await client.getBalances();
        expect(Array.isArray(balances)).toBe(true);
    });
});
