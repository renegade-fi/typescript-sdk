import { ExternalMatchClient } from "@renegade-fi/node";
import { API_KEY, API_SECRET, chainId } from "./env";

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

const response = await client.getTokenPrices();

console.log(response);
