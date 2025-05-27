import { ENVIRONMENT, ENV_AGNOSTIC_CHAINS } from "@renegade-fi/core";
import { chainIdFromEnvAndName, isSupportedEnvironment } from "@renegade-fi/core";
import { Token as CoreTokenAliased } from "@renegade-fi/token";

// Re-export all named exports from the core package.
export * from "@renegade-fi/token";

// Initialization Logic using the aliased CoreTokenAliased
const PACKAGE_NAME = "@renegade-fi/token-nextjs";

(() => {
    const environment = typeof window === "undefined" ? "SERVER" : "CLIENT";
    const logPrefix = `[${PACKAGE_NAME} on ${environment}]`;

    if (
        !process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT ||
        !isSupportedEnvironment(process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT)
    ) {
        console.error(
            `${logPrefix} NEXT_PUBLIC_CHAIN_ENVIRONMENT is unset or invalid, token mapping is unset.`,
            "Expected to be one of:",
            Object.values(ENVIRONMENT).join(", "),
        );
        return;
    }

    const chainEnvironment = process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT;
    const envAgnosticChains = Object.values(ENV_AGNOSTIC_CHAINS);

    for (const chain of envAgnosticChains) {
        let tokenMappingJson: string | undefined;
        let envVarName: string | undefined;

        switch (chain) {
            case ENV_AGNOSTIC_CHAINS.Arbitrum:
                tokenMappingJson = process.env.NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING;
                envVarName = "NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING";
                break;
            case ENV_AGNOSTIC_CHAINS.Base:
                tokenMappingJson = process.env.NEXT_PUBLIC_BASE_TOKEN_MAPPING;
                envVarName = "NEXT_PUBLIC_BASE_TOKEN_MAPPING";
                break;
        }

        if (
            !(
                tokenMappingJson &&
                typeof tokenMappingJson === "string" &&
                tokenMappingJson.trim() !== ""
            )
        ) {
            console.warn(
                `${logPrefix} ${envVarName} is not set or is empty. Token mapping not initialized from this env var.`,
                "Token operations will rely on default behavior (e.g., UNKNOWN token or errors if not handled by core Token class).",
            );
            continue;
        }

        try {
            const chainId = chainIdFromEnvAndName(chainEnvironment, chain);

            // Initialize the imported and aliased CoreTokenAliased
            CoreTokenAliased.addRemapFromString(chainId, tokenMappingJson);

            // Check if any tokens were actually loaded after parsing
            if (CoreTokenAliased.getAllTokensOnChain(chainId).length > 0) {
                console.info(
                    `${logPrefix} Token mapping initialized successfully from ${envVarName}. Loaded ${CoreTokenAliased.getAllTokensOnChain(chainId).length} tokens.`,
                );
            } else {
                console.warn(
                    `${logPrefix} Token mapping from ${envVarName} was processed but resulted in zero tokens. Check the JSON content.`,
                );
            }
        } catch (error) {
            console.error(
                `${logPrefix} Failed to parse token mapping from ${envVarName}. Token operations may fail or use defaults.`,
                error,
            );
        }
    }
})();

// Export initialized version of Token, which is the initialized CoreTokenAliased.
export const Token = CoreTokenAliased;
