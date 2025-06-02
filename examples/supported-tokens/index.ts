import { createAuthConfig, getSupportedTokens, getTokenPrices } from "@renegade-fi/node";

// -------------------------
// | Environment Variables |
// -------------------------

// Get API credentials from environment variables
const apiKey = process.env.EXTERNAL_MATCH_KEY;
const apiSecret = process.env.EXTERNAL_MATCH_SECRET;
const authServerUrl = "https://base-sepolia.auth-server.renegade.fi";

async function main() {
    try {
        if (!apiKey || !apiSecret) {
            throw new Error(
                "Missing required environment variables: EXTERNAL_MATCH_KEY and/or EXTERNAL_MATCH_SECRET",
            );
        }
        const config = createAuthConfig({
            apiKey,
            apiSecret,
            authServerUrl,
        });

        const tokens = await getSupportedTokens(config);
        console.log("Supported tokens: ", tokens.tokens.map((token) => token.symbol).join(", "));

        const tokenPrices = await getTokenPrices(config);
        console.log(
            "Token prices: ",
            tokenPrices.token_prices
                .map((price) => `${price.base_token}: $${price.price}`)
                .join(", "),
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
