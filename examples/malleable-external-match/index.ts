import {
    type AuthConfig,
    type GetExternalMatchQuoteReturnType,
    type MalleableExternalMatchResponse,
    Token,
    assembleMalleableQuote,
    createAuthConfig,
    getExternalMatchQuote,
    loadTokenMapping,
} from "@renegade-fi/node";
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

// -------------------------
// | Environment Variables |
// -------------------------

// Get API credentials from environment variables
const apiKey = process.env.EXTERNAL_MATCH_KEY;
const apiSecret = process.env.EXTERNAL_MATCH_SECRET;
const authServerUrl = "https://testnet.auth-server.renegade.fi";
const rpcUrl = process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

if (!apiKey || !apiSecret) {
    throw new Error(
        "Missing required environment variables: EXTERNAL_MATCH_KEY and/or EXTERNAL_MATCH_SECRET",
    );
}

if (!process.env.PKEY) {
    throw new Error("PKEY environment variable not set");
}

const pkey = process.env.PKEY.startsWith("0x") ? process.env.PKEY : `0x${process.env.PKEY}`;
const walletClient = createWalletClient({
    account: privateKeyToAccount(pkey as `0x${string}`),
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
});

// -------------------------
// | Quote + Assemble Flow |
// -------------------------

/**
 * Get a quote for the order
 * @param config The auth config
 * @returns The quote from the relayer
 */
async function getQuote(config: AuthConfig): Promise<GetExternalMatchQuoteReturnType> {
    console.log("Getting quote...");
    const baseToken = Token.findByTicker("WETH");
    const quoteToken = Token.findByTicker("USDC");

    return await getExternalMatchQuote(config, {
        disableGasSponsorship: false, // Note that this is false by default
        refundNativeEth: false, // Note that this is false by default
        order: {
            base: baseToken.address,
            quote: quoteToken.address,
            side: "sell",
            quoteAmount: BigInt(2000000000),
            minFillSize: BigInt(2),
        },
    });
}

/**
 * Assemble the quote into a malleable match bundle
 * @param quote The quote from the relayer
 * @param config The auth config
 * @returns The assembled malleable match bundle
 */
async function assembleQuote(
    quote: GetExternalMatchQuoteReturnType,
    config: AuthConfig,
): Promise<MalleableExternalMatchResponse> {
    console.log("Assembling quote...");
    return await assembleMalleableQuote(config, {
        quote,
    });
}

/**
 * Submit a transaction to the chain
 * @param settlementTx The settlement transaction
 * @returns The submitted transaction
 */
async function submitTransaction(settlementTx: any) {
    console.log("Submitting transaction...");
    const tx = await walletClient.sendTransaction({
        to: settlementTx.to,
        data: settlementTx.data,
        type: "eip1559",
    });
    return tx;
}

async function main() {
    await loadTokenMapping();
    const config = createAuthConfig({
        apiKey: apiKey!,
        apiSecret: apiSecret!,
        authServerUrl: authServerUrl,
    });

    try {
        const quote = await getQuote(config);
        if (!quote) {
            throw new Error("No quote received");
        }

        if (!quote.gas_sponsorship_info) {
            throw new Error("Transaction was not sponsored, abandoning...");
        }
        const gasSponsorshipInfo = quote.gas_sponsorship_info.gas_sponsorship_info;
        console.log("Refund amount:", gasSponsorshipInfo.refund_amount);

        const bundle = await assembleQuote(quote, config);

        // Print bundle info
        console.log("Bundle info:");
        const [minBase, maxBase] = bundle.baseBounds();
        console.log(`Base bounds: ${minBase} - ${maxBase}`);

        // Pick a random base amount and see the send and receive amounts at that base amount
        const dummyBaseAmount = randomInRange(minBase, maxBase);
        const dummySendAmount = bundle.sendAmountAtBase(dummyBaseAmount);
        const dummyReceiveAmount = bundle.receiveAmountAtBase(dummyBaseAmount);
        console.log(`Hypothetical base amount: ${dummyBaseAmount}`);
        console.log(`Hypothetical send amount: ${dummySendAmount}`);
        console.log(`Hypothetical receive amount: ${dummyReceiveAmount}`);

        // Pick an actual base amount to swap with
        const swappedBaseAmount = randomInRange(minBase, maxBase);

        // Setting the base amount will return the receive amount at the new base
        // You can also call sendAmount and receiveAmount to get the amounts at the
        // currently set base amount
        bundle.setBaseAmount(swappedBaseAmount);
        const send = bundle.sendAmount();
        const recv = bundle.receiveAmount();
        console.log(`Swapped base amount: ${swappedBaseAmount}`);
        console.log(`Send amount: ${send}`);
        console.log(`Receive amount: ${recv}`);

        // Submit the transaction
        const tx = bundle.match_bundle.settlement_tx;
        const txHash = await submitTransaction(tx);
        console.log(
            "Transaction submitted:",
            `${walletClient.chain.blockExplorers.default.url}/tx/${txHash}`,
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * Generate a random value in the given range
 */
function randomInRange(min: bigint, max: bigint): bigint {
    return min + BigInt(Math.floor(Math.random() * (Number(max) - Number(min))));
}

main().catch(console.error);
