import { describe, expect, it } from "vitest";
import { createClient, ensureAccount } from "./helpers.js";

describe("createAccount and getAccount", () => {
    it("creates an account if absent and fetches it", { timeout: 30_000 }, async () => {
        const client = await createClient();
        await ensureAccount(client);

        const account = await client.getAccount();
        expect(account.id).toBe(client.secrets.accountId);
        expect(Array.isArray(account.orders)).toBe(true);
        expect(Array.isArray(account.balances)).toBe(true);
    });

    it("throws on getAccount for a nonexistent account ID", { timeout: 15_000 }, async () => {
        // Use a throwaway key that has never had an account created
        const { privateKeyToAccount } = await import("viem/accounts");
        const { generatePrivateKey } = await import("viem/accounts");
        const { DirectMatchClient } = await import("../src/client.js");

        const throwawayKey = generatePrivateKey();
        const account = privateKeyToAccount(throwawayKey);
        const client = await DirectMatchClient.newBaseSepoliaClient(account);

        await expect(client.getAccount()).rejects.toThrow("getAccount failed");
    });
});
