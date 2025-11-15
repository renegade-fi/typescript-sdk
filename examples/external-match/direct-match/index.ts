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
const quoteAmount = BigInt(2_000_000); // 2 USDC
const side = OrderSide.BUY;

const order = {
    base_mint: WETH_ADDRESS,
    quote_mint: USDC_ADDRESS,
    side,
    quote_amount: quoteAmount,
} as const;

const options = RequestExternalMatchOptions.new().withGasEstimation(true);

console.log("Requesting external match...");
const matchResponse = await client.requestExternalMatchWithOptions(order, options);

if (!matchResponse) {
    console.error("No match available, exiting...");
    process.exit(1);
}

console.log("Received external match response", {
    gasSponsored: matchResponse.gas_sponsored,
    gasSponsorshipInfo: matchResponse.gas_sponsorship_info,
});

const bundle = matchResponse.match_bundle;
const tx = bundle.settlement_tx;

// --- Allowance Check --- //

const isSell = bundle.match_result.direction === "Sell";
const address = isSell
    ? (bundle.match_result.base_mint as `0x${string}`)
    : (bundle.match_result.quote_mint as `0x${string}`);
const amount = isSell ? bundle.match_result.base_amount : bundle.match_result.quote_amount;
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
