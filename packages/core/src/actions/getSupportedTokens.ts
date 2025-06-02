import { BaseError } from "viem";
import { getSDKConfig } from "../chains/defaults.js";
import { GET_SUPPORTED_TOKENS_ROUTE } from "../constants.js";
import type { AuthConfig } from "../createAuthConfig.js";
import { type RenegadeConfig, createConfig } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { getRelayerRaw } from "../utils/http.js";

/**
 * @see https://github.com/renegade-fi/rust-sdk/blob/main/src/external_match_client/api_types/token.rs/#L7
 */
export type ApiToken = {
    /** The token address */
    address: string;
    /** The token symbol */
    symbol: string;
};

export type GetSupportedTokensReturnType = { tokens: ApiToken[] };

export type GetSupportedTokensErrorType = BaseErrorType;

export async function getSupportedTokens(
    config: RenegadeConfig | AuthConfig,
): Promise<GetSupportedTokensReturnType> {
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
    const res = await getRelayerRaw(getBaseUrl(GET_SUPPORTED_TOKENS_ROUTE));
    if (!res.tokens) {
        throw new BaseError("Could not fetch supported tokens");
    }
    return { tokens: res.tokens.map((token: ApiToken) => ({ ...token })) };
}
