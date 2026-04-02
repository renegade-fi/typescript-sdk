import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Hex, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { AccountSecrets } from "../src/secrets.js";

const testData = JSON.parse(
    readFileSync(resolve(__dirname, "../test_data/test_data.json"), "utf-8"),
) as {
    chainId: number;
    accounts: { privateKey: string; accountId: string; authHmacKey: string }[];
};

describe("secrets derivation", () => {
    for (const entry of testData.accounts) {
        const label = `key ${entry.privateKey.slice(0, 10)}...`;

        it(`accountId matches golden data for ${label}`, async () => {
            const account = privateKeyToAccount(entry.privateKey as Hex);
            const secrets = await AccountSecrets.create(account, testData.chainId);
            expect(secrets.accountId).toBe(entry.accountId);
        });

        it(`authHmacKey matches golden data for ${label}`, async () => {
            const account = privateKeyToAccount(entry.privateKey as Hex);
            const secrets = await AccountSecrets.create(account, testData.chainId);
            expect(toHex(secrets.authHmacKey).slice(2)).toBe(entry.authHmacKey);
        });
    }
});
