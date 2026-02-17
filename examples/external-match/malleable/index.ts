import { ExternalMatchClient, OrderSide } from "@renegade-fi/renegade-sdk";
import { API_KEY, API_SECRET, walletClient } from "./env";
import { setRandomInputAmount } from "./helpers";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

const WETH_ADDRESS = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";
const USDC_ADDRESS = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
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

console.log("Assembling malleable quote...");

const bundle = await client.assembleMalleableQuote(quote);

if (!bundle) {
    console.error("No bundle available, exiting...");
    process.exit(1);
}

// Set a random input amount on the bundle
setRandomInputAmount(bundle);

const tx = bundle.settlementTx();

// --- Submit Bundle --- //

console.log("\nSubmitting bundle...");

const hash = await walletClient.sendTransaction({
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    value: BigInt(tx.value ?? "0x0"),
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
