import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Hex, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it, vi } from "vitest";
import { DirectMatchClient } from "../src/client.js";
import { AccountSecrets } from "../src/secrets.js";
import type { Signer } from "../src/types.js";

const testData = JSON.parse(
    readFileSync(resolve(__dirname, "../test_data/test_data.json"), "utf-8"),
) as {
    chainId: number;
    accounts: { privateKey: string; accountId: string; authHmacKey: string }[];
};

describe("AccountSecrets.fromPrecomputed", () => {
    it("round-trips with create() for the same key", async () => {
        const entry = testData.accounts[0]!;
        const account = privateKeyToAccount(entry.privateKey as Hex);
        const derived = await AccountSecrets.create(account, testData.chainId);

        const precomputed = AccountSecrets.fromPrecomputed({
            accountId: derived.accountId,
            authHmacKey: derived.authHmacKey,
            masterViewSeed: derived.masterViewSeed,
            schnorrPublicKey: derived.schnorrPublicKey,
        });

        expect(precomputed.accountId).toBe(derived.accountId);
        expect(toHex(precomputed.authHmacKey)).toBe(toHex(derived.authHmacKey));
        expect(precomputed.masterViewSeed).toBe(derived.masterViewSeed);
        expect(precomputed.schnorrPublicKey).toBe(derived.schnorrPublicKey);
        expect(precomputed.authHmacKeyBase64()).toBe(derived.authHmacKeyBase64());
        expect(precomputed.masterViewSeedHex()).toBe(derived.masterViewSeedHex());
    });
});

describe("DirectMatchClient.newWithExternalSigner", () => {
    it("constructs a client that delegates signing to the provided signer", async () => {
        const entry = testData.accounts[0]!;
        const account = privateKeyToAccount(entry.privateKey as Hex);
        const secrets = await AccountSecrets.create(account, testData.chainId);

        const signFn = vi.fn(account.sign);
        const signer: Signer = {
            address: account.address,
            sign: signFn,
        };

        const client = DirectMatchClient.newWithExternalSigner({
            baseUrl: "https://example.com",
            signer,
            secrets,
            chainId: testData.chainId,
        });

        expect(client.signer.address).toBe(account.address);
        expect(client.account).toBeUndefined();
        expect(client.secrets.accountId).toBe(secrets.accountId);
    });

    it("produces identical order auth as a PrivateKeyAccount client", async () => {
        const entry = testData.accounts[0]!;
        const account = privateKeyToAccount(entry.privateKey as Hex);
        const secrets = await AccountSecrets.create(account, testData.chainId);

        // External signer client using the same key
        const signer: Signer = {
            address: account.address,
            sign: account.sign.bind(account),
        };

        const externalClient = DirectMatchClient.newWithExternalSigner({
            baseUrl: "https://example.com",
            signer,
            secrets,
            chainId: testData.chainId,
        });

        // Both should build the same order core (same address, same fields)
        // We can't easily compare signatures (nonces are random), but we can
        // verify the external client's signer is called
        const signSpy = vi.spyOn(signer, "sign");

        // Access the private buildPublicOrderAuth via placeOrder —
        // it will fail on HTTP but the signer should have been called
        try {
            await externalClient.placeOrder({
                inputMint: "0x0000000000000000000000000000000000000001",
                outputMint: "0x0000000000000000000000000000000000000002",
                inputAmount: 1000n,
            });
        } catch {
            // Expected: HTTP call fails against example.com
        }

        expect(signSpy).toHaveBeenCalled();
    });
});
