import {
    type AuthConfig,
    CHAIN_IDS,
    type GetExternalMatchQuoteReturnType,
    createAuthConfig,
} from "@renegade-fi/node";
import { Token } from "@renegade-fi/token";
// Then do the imports
import { http, createWalletClient, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
    assembleExternalQuote,
    getExternalMatchQuote,
} from "../../packages/core/src/exports/actions";
import type { ExternalMatchResponse } from "../../packages/core/src/types/externalMatch";

// -------------------------
// | Environment Variables |
// -------------------------

// Get API credentials from environment variables
const apiKey = process.env.EXTERNAL_MATCH_KEY;
const apiSecret = process.env.EXTERNAL_MATCH_SECRET;
const authServerUrl = "https://base-sepolia.auth-server.renegade.fi";
const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org";

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
    chain: baseSepolia,
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
        order: {
            base: baseToken.address,
            quote: quoteToken.address,
            side: "buy",
            quoteAmount: BigInt(2000000000),
            minFillSize: BigInt(2),
        },
    });
}

/**
 * Assemble the quote into a bundle that can be submitted on-chain
 * @param quote The quote from the relayer
 * @param config The auth config
 * @returns The assembled bundle
 */
async function assembleQuote(
    quote: GetExternalMatchQuoteReturnType,
    config: AuthConfig,
): Promise<ExternalMatchResponse> {
    console.log("Assembling quote...");
    const baseToken = Token.fromTicker("WETH");
    const quoteToken = Token.fromTicker("USDC");
    return await assembleExternalQuote(config, {
        quote,
        updatedOrder: {
            base: baseToken.address,
            quote: quoteToken.address,
            side: "buy",
            quoteAmount: BigInt(20_000_000) /* $20 */,
            minFillSize: BigInt(20),
        },
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
    await Token.fetchRemapFromRepo(CHAIN_IDS.BaseSepolia);
    const config = createAuthConfig({
        apiKey: process.env.EXTERNAL_MATCH_KEY ?? "",
        apiSecret: process.env.EXTERNAL_MATCH_SECRET ?? "",
        authServerUrl: authServerUrl,
    });

    try {
        const quote = await getQuote(config);
        if (!quote) {
            throw new Error("No quote received");
        }

        const bundle = await assembleQuote(quote, config);
        const txHash = await submitTransaction(bundle.match_bundle.settlement_tx);
        console.log(
            "Transaction submitted:",
            `${walletClient.chain.blockExplorers.default.url}/tx/${txHash}`,
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
