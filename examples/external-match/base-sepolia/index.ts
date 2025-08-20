import { ExternalMatchClient, OrderSide } from "@renegade-fi/renegade-sdk";
import { erc20Abi } from "viem";
import { API_KEY, API_SECRET, owner, publicClient, walletClient } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newBaseSepoliaClient(API_KEY, API_SECRET);

const WETH_ADDRESS = "0x31a5552AF53C35097Fdb20FFf294c56dc66FA04c";
const USDC_ADDRESS = "0xD9961Bb4Cb27192f8dAd20a662be081f546b0E74";
const quoteAmount = BigInt(2_000_000); // 2 USDC
const side = OrderSide.BUY;

const order = {
    base_mint: WETH_ADDRESS,
    quote_mint: USDC_ADDRESS,
    side,
    quote_amount: quoteAmount,
} as const;

console.log("Fetching quote...");

const quote = await client.requestQuote(order);

if (!quote) {
    console.error("No quote available, exiting...");
    process.exit(1);
}

console.log("Assmbling quote...");

const bundle = await client.assembleQuote(quote);

if (!bundle) {
    console.error("No bundle available, exiting...");
    process.exit(1);
}

const tx = bundle.match_bundle.settlement_tx;

// --- Allowance Check --- //

const isSell = bundle.match_bundle.match_result.direction === "Sell";
const address = isSell
    ? (bundle.match_bundle.match_result.base_mint as `0x${string}`)
    : (bundle.match_bundle.match_result.quote_mint as `0x${string}`);
const amount = isSell
    ? bundle.match_bundle.match_result.base_amount
    : bundle.match_bundle.match_result.quote_amount;
const spender = tx.to as `0x${string}`;

console.log("Checking allowance...");

const allowance = await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
});

if (allowance < amount) {
    console.log("Allowance is less than amount, approving...");
    const approveTx = await walletClient.writeContract({
        address,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
    });
    console.log("Submitting approve transaction...");
    await publicClient.waitForTransactionReceipt({
        hash: approveTx,
    });
    console.log("Successfully submitted approve transaction", approveTx);
}

// --- Submit Bundle --- //

console.log("Submitting bundle...");

const hash = await walletClient.sendTransaction({
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
