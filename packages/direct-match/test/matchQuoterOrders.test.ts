import { type Address, createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
    createClient,
    ensureAccount,
    ensureAllowances,
    getQuotersApiKey,
    getRelayerAdminKey,
    sleep,
    USDC,
    WETH,
    waitForOrderFill,
} from "./helpers.js";

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const USDC_AMOUNT = 100_000_000n; // 100 USDC (6 decimals)

if (!process.env.PRIVATE_KEY) {
    console.error("PRIVATE_KEY env var required");
    process.exit(1);
}

const QUOTERS_URL = "https://base-sepolia.v2.quoters.renegade.fi:3000";

/** Fetch the quoters /view and find a WETH matching pool with active orders */
async function findWethMatchingPool(apiKey: string): Promise<string> {
    const resp = await fetch(`${QUOTERS_URL}/view`, {
        headers: { "x-api-key": apiKey },
    });
    if (!resp.ok) {
        throw new Error(`Quoters /view failed (${resp.status}): ${await resp.text()}`);
    }
    const view = (await resp.json()) as Record<string, unknown>;
    const quoters = view.quoters as Record<string, { orders?: Record<string, unknown>[] }>;

    for (const [key, quoter] of Object.entries(quoters)) {
        if (!key.toLowerCase().includes("weth")) continue;
        if (quoter.orders && quoter.orders.length > 0) {
            const order = quoter.orders[0]!;
            for (const parentKey of [
                "match_options",
                "matching_options",
                "external_match_options",
                "",
            ]) {
                const parent = parentKey
                    ? (order[parentKey] as Record<string, unknown> | undefined)
                    : order;
                if (!parent) continue;
                for (const field of ["matching_pool", "matchingPool", "matching-pool"]) {
                    if (field in parent) {
                        return String(parent[field]);
                    }
                }
            }
        }
    }

    throw new Error("No active WETH quoter orders found");
}

describe("match against quoter orders", () => {
    console.log("NOTE: WETH quoters must be funded and rebalanced before running this test.");
    console.log("      Use the quoters API to rebalance, and fund EOAs if allocation is 0.\n");
    it(
        "places a USDC→WETH order in the quoter's pool and waits for fill",
        { timeout: 180_000 },
        async () => {
            const quotersApiKey = getQuotersApiKey();
            const adminKey = getRelayerAdminKey();

            // 1. Set up client and account
            const client = await createClient();
            await ensureAccount(client);
            console.log(`Account: ${client.signer.address}`);

            // 2. Cancel stale orders from previous runs
            const stale = await client.getOrders(false);
            for (const order of stale) {
                try {
                    console.log(`Cancelling stale order ${order.id}`);
                    await client.cancelOrder(order.id);
                } catch (e) {
                    console.log(
                        `Skipping order ${order.id}: ${e instanceof Error ? e.message : e}`,
                    );
                }
            }

            // 3. Find a WETH matching pool with active quoter orders
            const matchingPool = await findWethMatchingPool(quotersApiKey);
            console.log(`Using matching pool: ${matchingPool}`);

            // 4. Check USDC balance
            const usdcBalance = await publicClient.readContract({
                address: USDC as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [client.signer.address],
            });
            console.log(`USDC balance: ${formatUnits(usdcBalance, 6)}`);
            expect(usdcBalance).toBeGreaterThanOrEqual(USDC_AMOUNT);

            // 5. Snapshot WETH balance before (to detect settlement on-chain)
            const wethBefore = await publicClient.readContract({
                address: WETH as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [client.signer.address],
            });
            console.log(`WETH balance before: ${formatUnits(wethBefore, 18)}`);

            // 6. Ensure Permit2 allowances FIRST (on-chain state must be ready
            //    before sync queries it)
            console.log("Ensuring Permit2 allowances for USDC...");
            await ensureAllowances(client.account!, USDC as Address, USDC_AMOUNT);

            // 6. Place the order
            const beforeOrders = new Set((await client.getOrders(false)).map((o) => o.id));
            console.log("Placing USDC→WETH order...");
            await client.placeOrderInPool(
                {
                    inputMint: USDC,
                    outputMint: WETH,
                    inputAmount: USDC_AMOUNT,
                },
                matchingPool,
                adminKey,
            );

            const afterOrders = await client.getOrders(false);
            const placed = afterOrders.find((o) => !beforeOrders.has(o.id));
            expect(placed).toBeDefined();
            console.log(`Placed order: ${placed!.id}`);

            // 7. Repeatedly sync until the relayer indexes a non-zero USDC balance.
            //    The sync queries the indexer for active orders, then fetches
            //    on-chain EOA balances. The indexer needs time to pick up our order.
            // The sync queries the indexer for active orders, fetches on-chain
            // EOA balances, and triggers the matching engine via success hook.
            // We retry because the indexer may take time to index our order.
            let synced = false;
            for (let attempt = 1; attempt <= 10; attempt++) {
                console.log(`Sync attempt ${attempt}/10...`);
                await sleep(3_000);
                await client.syncAccount();

                // Check via getAccount (returns all balances including EOA)
                const acct = await client.getAccount();
                const usdcBal = acct.balances.find(
                    (b) => b.mint.toLowerCase() === USDC.toLowerCase(),
                );
                console.log(`  USDC balance (getAccount): ${usdcBal?.amount ?? "not found"}`);
                console.log(`  Orders: ${acct.orders.length}`);

                if (usdcBal && usdcBal.amount !== "0") {
                    synced = true;
                    break;
                }
            }
            console.log(
                `Sync result: ${synced ? "balance indexed" : "balance still 0 after retries"}`,
            );

            // 9. Poll with exponential backoff — detect fill via WETH balance change
            await waitForOrderFill(client, placed!.id, {
                token: WETH as Address,
                owner: client.signer.address,
                balanceBefore: wethBefore,
            });

            // 10. Verify fill
            const wethAfter = await publicClient.readContract({
                address: WETH as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [client.signer.address],
            });
            const wethReceived = wethAfter - wethBefore;
            console.log(`WETH received: ${formatUnits(wethReceived, 18)}`);

            expect(wethReceived).toBeGreaterThan(0n);
        },
    );
});
