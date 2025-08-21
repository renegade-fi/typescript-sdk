import { ExternalMatchClient } from "@renegade-fi/renegade-sdk";
import { API_KEY, API_SECRET } from "./env";

if (!API_KEY) {
    throw new Error("API_KEY is not set");
}

if (!API_SECRET) {
    throw new Error("API_SECRET is not set");
}

const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

const response = await client.getTokenPrices();

console.log(response);
