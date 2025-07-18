import { ExternalMatchClient } from "@renegade-fi/node";
import { erc20Abi } from "viem";
import { API_KEY, API_SECRET, chainId, owner, publicClient, walletClient } from "./env";

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
const quoteAmount = BigInt(20_000_000); // 20 USDC
const side = "sell";

const order = {
    base: WETH_ADDRESS,
    quote: USDC_ADDRESS,
    side,
    quoteAmount,
} as const;

console.log("Fetching quote...");

const quote = await client.getQuote({
    order,
    disableGasSponsorship: false,
});

const gasSponsorshipInfo = quote.gas_sponsorship_info?.gas_sponsorship_info;
if (!gasSponsorshipInfo) {
    throw new Error("Transaction was not sponsored, abandoning...");
}
console.log("Refund amount:", gasSponsorshipInfo.refund_amount);

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
