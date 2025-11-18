import {
    ExternalMatchClient,
    OrderSide,
    RequestExternalMatchOptions,
} from "@renegade-fi/renegade-sdk";
import { erc20Abi } from "viem";
import { API_KEY, API_SECRET, owner, publicClient, walletClient } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

const WETH_ADDRESS = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";
const USDC_ADDRESS = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
const quoteAmount = BigInt(30_000_000); // 30 USDC
const side = OrderSide.BUY;

const order = {
    base_mint: WETH_ADDRESS,
    quote_mint: USDC_ADDRESS,
    side,
    quote_amount: quoteAmount,
} as const;

const options = RequestExternalMatchOptions.new().withGasEstimation(true);

console.log("Requesting malleable external match...");
const matchResponse = await client.requestMalleableExternalMatchWithOptions(order, options);

if (!matchResponse) {
    console.error("No match available, exiting...");
    process.exit(1);
}

console.log("Received malleable external match response", {
    gasSponsored: matchResponse.gas_sponsored,
    gasSponsorshipInfo: matchResponse.gas_sponsorship_info,
});

// --- Malleable Bundle Manipulation --- //

// Print bundle info
console.log("\nBundle bounds:");
const [minBase, maxBase] = matchResponse.baseBounds();
const [minQuote, maxQuote] = matchResponse.quoteBounds();
console.log(`Base bounds: ${minBase} - ${maxBase}`);
console.log(`Quote bounds: ${minQuote} - ${maxQuote}`);

// Set a specific base amount on the bundle
// This modifies the settlement transaction calldata to use the specified amount
const targetBaseAmount = minBase + (maxBase - minBase) / BigInt(2);
const receiveAmount = matchResponse.setBaseAmount(targetBaseAmount);
const sendAmount = matchResponse.sendAmount();

console.log(`\nSet base amount: ${targetBaseAmount}`);
console.log(`Send amount: ${sendAmount}`);
console.log(`Receive amount: ${receiveAmount}`);

// Alternatively, you can set a quote amount instead:
// const targetQuoteAmount = minQuote + (maxQuote - minQuote) / BigInt(2);
// matchResponse.setQuoteAmount(targetQuoteAmount);

const bundle = matchResponse.match_bundle;
const tx = bundle.settlement_tx;

// --- Allowance Check --- //

const isSell = bundle.match_result.direction === OrderSide.SELL;
const address = isSell
    ? (bundle.match_result.base_mint as `0x${string}`)
    : (bundle.match_result.quote_mint as `0x${string}`);
// Use the send amount that was set via setBaseAmount (or max if not set)
const amount = sendAmount; // This is the amount that will actually be sent
const spender = tx.to as `0x${string}`;

console.log("\nChecking allowance...");

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

console.log("\nSubmitting bundle...");

const hash = await walletClient.sendTransaction({
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
