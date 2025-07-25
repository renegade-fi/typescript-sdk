import { ExternalMatchClient } from "@renegade-fi/node";
import { API_KEY, API_SECRET, chainId, walletClient } from "./env";
import { setRandomBaseAmount } from "./helpers";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.new({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    chainId,
});

const WETH_ADDRESS = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";
const USDC_ADDRESS = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
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

const bundle = await client.assembleMalleableQuote({
    quote,
});

// Set a base amount on the bundle
// Alternatively, you can set a quote amount on the bundle - see
// `setRandomQuoteAmount` in `helpers.ts`
setRandomBaseAmount(bundle);

const tx = bundle.match_bundle.settlement_tx;

// --- Submit Bundle --- //

console.log("Submitting bundle...");

const hash = await walletClient.sendTransaction({
    to: tx.to,
    data: tx.data,
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
