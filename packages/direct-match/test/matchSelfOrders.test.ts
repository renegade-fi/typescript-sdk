import { type Address, createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { describe, expect, it } from "vitest";
import { DirectMatchClient } from "../src/client.js";
import { ensureAccount, ensureAllowances, sleep, USDC, WETH } from "./helpers.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2;

if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY env var required");
    process.exit(1);
}
if (!PRIVATE_KEY_2) {
    console.error("PRIVATE_KEY_2 env var required");
    process.exit(1);
}

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

const USDC_AMOUNT = 2_000_000n; // 2 USDC (6 decimals)
const WETH_AMOUNT = 1_000_000_000_000_000n; // 0.001 WETH (18 decimals)

async function getErc20Balance(token: Address, owner: Address): Promise<bigint> {
    return publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
    });
}

describe("match self orders", () => {
    it(
        "places opposing orders from two accounts and verifies settlement",
        { timeout: 120_000 },
        async () => {
            const accountA = privateKeyToAccount(PRIVATE_KEY as Hex);
            const accountB = privateKeyToAccount(PRIVATE_KEY_2 as Hex);

            const clientA = await DirectMatchClient.newBaseSepoliaClient(accountA);
            const clientB = await DirectMatchClient.newBaseSepoliaClient(accountB);

            await ensureAccount(clientA);
            await ensureAccount(clientB);

            // 1. Ensure Permit2 allowances
            await ensureAllowances(accountA, USDC as Address, USDC_AMOUNT);
            await ensureAllowances(accountB, WETH as Address, WETH_AMOUNT);

            // 2. Snapshot output token balances
            const wethBeforeA = await getErc20Balance(WETH as Address, accountA.address);
            const usdcBeforeB = await getErc20Balance(USDC as Address, accountB.address);

            // 3. Place both orders concurrently
            const [resultA, resultB] = await Promise.allSettled([
                clientA.placeOrder({ inputMint: USDC, outputMint: WETH, inputAmount: USDC_AMOUNT }),
                clientB.placeOrder({ inputMint: WETH, outputMint: USDC, inputAmount: WETH_AMOUNT }),
            ]);
            console.log(`Orders: A=${resultA.status}, B=${resultB.status}`);

            // 4. Poll for on-chain balance change
            let matched = false;
            for (let attempt = 1; attempt <= 10; attempt++) {
                await sleep(2_000);

                const wethNowA = await getErc20Balance(WETH as Address, accountA.address);
                const usdcNowB = await getErc20Balance(USDC as Address, accountB.address);

                if (wethNowA > wethBeforeA || usdcNowB > usdcBeforeB) {
                    console.log(`Match settled after ${attempt * 2}s`);
                    console.log(`  A received ${formatUnits(wethNowA - wethBeforeA, 18)} WETH`);
                    console.log(`  B received ${formatUnits(usdcNowB - usdcBeforeB, 6)} USDC`);
                    matched = true;
                    break;
                }
            }

            // 5. Clean up remaining orders
            for (const o of await clientA.getOrders(false)) {
                try {
                    await clientA.cancelOrder(o.id);
                } catch {
                    /* skip */
                }
            }
            for (const o of await clientB.getOrders(false)) {
                try {
                    await clientB.cancelOrder(o.id);
                } catch {
                    /* skip */
                }
            }

            expect(matched).toBe(true);
        },
    );
});
