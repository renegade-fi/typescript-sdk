import { ExternalMatchClient } from "@renegade-fi/renegade-sdk";
import { API_KEY, API_SECRET } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

const metadata = await client.getExchangeMetadata();

console.log(`Chain ID: ${metadata.chain_id}`);
console.log(`Settlement Contract Address: ${metadata.settlement_contract_address}`);
console.log(`Supported Tokens (${metadata.supported_tokens.length}):`);
metadata.supported_tokens.forEach((token) => {
    console.log(`  - ${token.symbol}: ${token.address}`);
});
