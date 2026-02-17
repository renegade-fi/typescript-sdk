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
    gasSponsored: matchResponse.gas_sponsorship_info != null,
    gasSponsorshipInfo: matchResponse.gas_sponsorship_info,
});

// --- Malleable Bundle Manipulation --- //

// Print bundle info (v2 uses input/output terminology)
console.log("\nBundle bounds:");
const [minInput, maxInput] = matchResponse.inputBounds();
const [minOutput, maxOutput] = matchResponse.outputBounds();
console.log(`Input bounds: ${minInput} - ${maxInput}`);
console.log(`Output bounds: ${minOutput} - ${maxOutput}`);

// Set a specific input amount on the bundle
// This modifies the settlement transaction calldata to use the specified amount
const targetInputAmount = minInput + (maxInput - minInput) / BigInt(2);
const receiveAmount = matchResponse.setInputAmount(targetInputAmount);
const sendAmount = matchResponse.sendAmount();

console.log(`\nSet input amount: ${targetInputAmount}`);
console.log(`Send amount: ${sendAmount}`);
console.log(`Receive amount: ${receiveAmount}`);

const bundle = matchResponse.match_bundle;
const tx = bundle.settlement_tx;

// --- Allowance Check --- //

// The input token is what we send; skip ERC20 approval for native ETH sells
const inputMint = bundle.match_result.input_mint as `0x${string}`;
const amount = sendAmount; // This is the amount that will actually be sent
const spender = tx.to as `0x${string}`;

if (!matchResponse.isNativeEthSell()) {
    console.log("\nChecking allowance...");

    const allowance = await publicClient.readContract({
        address: inputMint,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
    });

    if (allowance < amount) {
        console.log("Allowance is less than amount, approving...");
        const approveTx = await walletClient.writeContract({
            address: inputMint,
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
}

// --- Submit Bundle --- //

console.log("\nSubmitting bundle...");

const hash = await walletClient.sendTransaction({
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    value: BigInt(tx.value ?? "0x0"),
    type: "eip1559",
});

console.log("Successfully submitted transaction", hash);
