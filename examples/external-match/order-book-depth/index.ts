import { ExternalMatchClient } from "@renegade-fi/renegade-sdk";
import { API_KEY, API_SECRET } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

// Example base token mint (WETH)
const WETH = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";

const depth = await client.getOrderBookDepth(WETH);

console.log(depth);
