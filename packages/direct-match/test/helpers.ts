import { execSync } from "node:child_process";
import {
    type Address,
    createPublicClient,
    createWalletClient,
    erc20Abi,
    type Hex,
    http,
    maxUint48,
    maxUint160,
} from "viem";
import { type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { DirectMatchClient } from "../src/client.js";
import type { ApiOrder } from "../src/types.js";

// Permit2 canonical address (same on all chains)
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address;
// Darkpool address on Base Sepolia
const DARKPOOL = "0xDE9BfD62B2187d4c14FBcC7D869920d34e4DB3Da" as Address;

const permit2Abi = [
    {
        type: "function",
        name: "allowance",
        inputs: [
            { name: "user", type: "address" },
            { name: "token", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "approve",
        inputs: [
            { name: "token", type: "address" },
            { name: "spender", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

// Base Sepolia test token addresses
export const USDC = "0xD9961Bb4Cb27192f8dAd20a662be081f546b0E74";
export const WETH = "0x31a5552AF53C35097Fdb20FFf294c56dc66FA04c";

// AWS Secrets Manager paths for Base Sepolia v2
const AWS_REGION = "us-east-2";
const AWS_QUOTERS_API_KEY_SECRET = "/base/sepolia/v2/quoters-api-key";
const AWS_ADMIN_API_KEY_SECRET = "/base/sepolia/v2/admin-api-key";

/**
 * Fetch a secret from AWS Secrets Manager via the CLI.
 * Requires the AWS CLI to be installed and authenticated.
 */
function fetchAwsSecret(secretId: string): string {
    try {
        const result = execSync(
            `aws secretsmanager get-secret-value --secret-id ${secretId} --region ${AWS_REGION} --query SecretString --output text`,
            { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
        );
        return result.trim();
    } catch {
        throw new Error(
            `Failed to fetch AWS secret ${secretId}. Ensure the AWS CLI is installed and authenticated (aws sso login).`,
        );
    }
}

/** Get the quoters API key from env var or AWS Secrets Manager */
export function getQuotersApiKey(): string {
    if (process.env.QUOTERS_API_KEY) return process.env.QUOTERS_API_KEY;
    return fetchAwsSecret(AWS_QUOTERS_API_KEY_SECRET);
}

/** Get the relayer admin key from env var or AWS Secrets Manager */
export function getRelayerAdminKey(): string {
    if (process.env.RELAYER_ADMIN_KEY) return process.env.RELAYER_ADMIN_KEY;
    return fetchAwsSecret(AWS_ADMIN_API_KEY_SECRET);
}

export function getPrivateKey(): Hex {
    const key = process.env.PRIVATE_KEY;
    if (!key) throw new Error("PRIVATE_KEY env var required");
    return key as Hex;
}

export async function createClient(): Promise<DirectMatchClient> {
    const account = privateKeyToAccount(getPrivateKey());
    return DirectMatchClient.newBaseSepoliaClient(account);
}

export async function ensureAccount(client: DirectMatchClient): Promise<void> {
    try {
        await client.getAccount();
    } catch {
        await client.createAccount();
    }
}

const baseSepoliaPublicClient = createPublicClient({ chain: baseSepolia, transport: http() });

/**
 * Ensure ERC20 and Permit2 allowances are set for a token.
 * Two-step approval: ERC20→Permit2, then Permit2→Darkpool.
 */
export async function ensureAllowances(
    account: PrivateKeyAccount,
    token: Address,
    amount: bigint,
): Promise<void> {
    const pub = baseSepoliaPublicClient;
    const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });
    const owner = account.address;

    // Step 1: ERC20 approval for Permit2
    const erc20Allowance = await pub.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, PERMIT2],
    });
    if (erc20Allowance < amount) {
        const hash = await wallet.writeContract({
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [PERMIT2, amount],
        });
        await pub.waitForTransactionReceipt({ hash, confirmations: 1 });
        console.log(`  ERC20 approval for Permit2 confirmed: ${hash}`);
    }

    // Step 2: Permit2 allowance for Darkpool
    const [permit2Amount, permit2Expiration] = await pub.readContract({
        address: PERMIT2,
        abi: permit2Abi,
        functionName: "allowance",
        args: [owner, token, DARKPOOL],
    });
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (permit2Amount < amount || permit2Expiration < now) {
        const hash = await wallet.writeContract({
            address: PERMIT2,
            abi: permit2Abi,
            functionName: "approve",
            args: [token, DARKPOOL, maxUint160, maxUint48],
        });
        await pub.waitForTransactionReceipt({ hash, confirmations: 1 });
        console.log(`  Permit2 allowance for Darkpool confirmed: ${hash}`);
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll with exponential backoff until an order leaves the active list,
 * has fills, or an on-chain balance change is detected.
 *
 * Pass `balanceCheck` to detect settlement via ERC20 balance change
 * (useful when the relayer doesn't report fills for Ring 0 orders).
 */
export async function waitForOrderFill(
    client: DirectMatchClient,
    orderId: string,
    balanceCheck?: { token: Address; owner: Address; balanceBefore: bigint },
    maxAttempts = 6,
    initialDelayMs = 2_000,
): Promise<ApiOrder | null> {
    let delayMs = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`  Poll ${attempt}/${maxAttempts} (${delayMs / 1000}s)...`);
        await sleep(delayMs);

        // Check on-chain balance change (most reliable for Ring 0)
        if (balanceCheck) {
            const currentBalance = await baseSepoliaPublicClient.readContract({
                address: balanceCheck.token,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [balanceCheck.owner],
            });
            if (currentBalance !== balanceCheck.balanceBefore) {
                console.log(
                    `    Balance changed: ${balanceCheck.balanceBefore} → ${currentBalance}`,
                );
                // Return the order from whichever endpoint has it
                const active = await client.getOrders(false);
                const order = active.find((o) => o.id === orderId);
                if (order) return order;
                const historic = await client.getOrders(true);
                return historic.find((o) => o.id === orderId) ?? null;
            }
        }

        const active = await client.getOrders(false);
        const stillActive = active.find((o) => o.id === orderId);

        if (!stillActive) {
            const historic = await client.getOrders(true);
            return historic.find((o) => o.id === orderId) ?? null;
        }

        if (stillActive.fills.length > 0) {
            console.log(`    Partially filled (${stillActive.fills.length} fill(s))`);
            return stillActive;
        }

        console.log(`    Still active (state: ${stillActive.state})`);
        delayMs = Math.min(delayMs * 2, 60_000);
    }

    return null; // Timed out
}
