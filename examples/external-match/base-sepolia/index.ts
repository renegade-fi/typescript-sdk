import { ExternalMatchClient } from "@renegade-fi/node";
import { erc20Abi } from "viem";
import { API_KEY, API_SECRET, owner, publicClient, walletClient } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newBaseSepoliaClient({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
});

const WETH_ADDRESS = "0x31a5552AF53C35097Fdb20FFf294c56dc66FA04c";
const USDC_ADDRESS = "0xD9961Bb4Cb27192f8dAd20a662be081f546b0E74";
const quoteAmount = BigInt(2_000_000); // 2 USDC
const side = "buy";

const order = {
    base: WETH_ADDRESS,
    quote: USDC_ADDRESS,
    side,
    quoteAmount,
} as const;

console.log("Fetching quote...");

const quote = await client.getQuote({
    order,
});

console.log("Assmbling quote...");

const bundle = await client.assembleQuote({
    quote,
});

const tx = bundle.match_bundle.settlement_tx;

// --- Allowance Check --- //

const isSell = bundle.match_bundle.match_result.direction === "Sell";
const address = isSell
    ? bundle.match_bundle.match_result.base_mint
    : bundle.match_bundle.match_result.quote_mint;
const amount = isSell
    ? bundle.match_bundle.match_result.base_amount
    : bundle.match_bundle.match_result.quote_amount;

console.log("Checking allowance...");

const allowance = await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, tx.to],
});

if (allowance < amount) {
    console.log("Allowance is less than amount, approving...");
    const approveTx = await walletClient.writeContract({
        address,
        abi: erc20Abi,
        functionName: "approve",
        args: [tx.to, amount],
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
    to: tx.to,
    data: tx.data,
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
