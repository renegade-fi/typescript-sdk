import invariant from "tiny-invariant";
import type { Hex } from "viem";
import { CHAIN_SPECIFIERS, type ChainId } from "./constants.js";
import type { BaseConfig } from "./createConfig.js";
import type * as rustUtils from "./utils.d.ts";

export type CreateAuthConfigParameters = {
    apiKey: string;
    apiSecret: string;
    authServerUrl: string;
    utils?: typeof rustUtils;
};

/**
 * Creates a configuration object specifically for authenticating with the relayer authentication server.
 * This is distinct from the main config (created by `createConfig`) which handles wallet operations.
 *
 * While `createConfig` is used for wallet-related interactions with the relayer (like creating orders
 * or managing wallet state), this auth config is solely for endpoints that require API key authentication,
 * such as external match requests of external orders.
 */
export function createAuthConfig(parameters: CreateAuthConfigParameters): AuthConfig {
    const { apiKey, apiSecret, authServerUrl } = parameters;
    invariant(
        parameters.utils,
        "Utils must be provided by the package if not supplied by the user.",
    );
    return {
        utils: parameters.utils,
        // Not used for wallet operations
        renegadeKeyType: "none" as const,
        apiKey,
        apiSecret,
        getBaseUrl: (route = "") => {
            const formattedRoute = route.startsWith("/") ? route : `/${route}`;
            return `${authServerUrl}/v0${formattedRoute}`;
        },
        getWebsocketBaseUrl: () => {
            throw new Error("Not implemented");
        },
        getSymmetricKey: () => {
            invariant(parameters.utils, "Utils are required");
            return parameters.utils.b64_to_hex_hmac_key(apiSecret) as Hex;
        },
        getChainId: (): ChainId => {
            const url = new URL(authServerUrl);
            const hostname = url.hostname;
            const chainSpecifier = hostname.split(".")[0];
            const chainId = Object.entries(CHAIN_SPECIFIERS).find(
                ([_, value]) => value === chainSpecifier,
            )?.[0];
            if (!chainId) {
                throw new Error(`Unknown chain specifier: ${chainSpecifier}`);
            }
            return Number.parseInt(chainId) as ChainId;
        },
    };
}

export type AuthConfig = BaseConfig & {
    apiSecret: string;
    apiKey: string;
    getBaseUrl: (route?: string) => string;
    renegadeKeyType: "none";
    getChainId: () => ChainId;
};
