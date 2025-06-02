import { BaseError } from "viem";
import { getSDKConfig } from "../chains/defaults.js";
import { GET_TOKEN_PRICES_ROUTE } from "../constants.js";
import type { AuthConfig } from "../createAuthConfig.js";
import { type RenegadeConfig, createConfig } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { getRelayerRaw } from "../utils/http.js";

/**
 * @see https://github.com/renegade-fi/rust-sdk/blob/main/src/external_match_client/api_types/token.rs/#L16
 */
export type TokenPrice = {
    /// The mint (ERC20 address) of the base token
    base_token: string;
    /// The mint (ERC20 address) of the quote token
    quote_token: string;
    /// The price data for this token
    price: number;
};

export type GetTokenPricesReturnType = { token_prices: TokenPrice[] };

export type GetTokenPricesErrorType = BaseErrorType;

export async function getTokenPrices(
    config: RenegadeConfig | AuthConfig,
): Promise<GetTokenPricesReturnType> {
    let relayerConfig = config;
    if (config.renegadeKeyType === "none") {
        const chainId = config.getChainId();
        const sdkConfig = getSDKConfig(chainId);
        relayerConfig = createConfig({
            darkPoolAddress: sdkConfig.darkpoolAddress,
            priceReporterUrl: sdkConfig.priceReporterUrl,
            relayerUrl: sdkConfig.relayerUrl,
            chainId,
            utils: config.utils,
        });
    }
    const { getBaseUrl } = relayerConfig;
    const res = await getRelayerRaw(getBaseUrl(GET_TOKEN_PRICES_ROUTE));
    if (!res.token_prices) {
        throw new BaseError("Could not fetch token prices");
    }
    return {
        token_prices: res.token_prices.map((tokenPrice: TokenPrice) => ({
            ...tokenPrice,
            price: Number.parseFloat(tokenPrice.price.toString()),
        })),
    };
}
