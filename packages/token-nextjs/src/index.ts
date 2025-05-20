import { Token as CoreTokenAliased } from "@renegade-fi/token";

// Re-export all named exports from the core package.
export * from "@renegade-fi/token";

// Initialization Logic using the aliased CoreTokenAliased
const PACKAGE_NAME = "@renegade-fi/token-nextjs";

(() => {
    const tokenMappingJson = process.env.NEXT_PUBLIC_TOKEN_MAPPING;
    const environment = typeof window === "undefined" ? "SERVER" : "CLIENT";
    const logPrefix = `[${PACKAGE_NAME} on ${environment}]`;

    if (
        tokenMappingJson &&
        typeof tokenMappingJson === "string" &&
        tokenMappingJson.trim() !== ""
    ) {
        try {
            // Initialize the imported and aliased CoreTokenAliased
            CoreTokenAliased.parseRemapFromString(tokenMappingJson);

            // Check if any tokens were actually loaded after parsing
            if (CoreTokenAliased.getAllTokens().length > 0) {
                console.info(
                    `${logPrefix} Token mapping initialized successfully from NEXT_PUBLIC_TOKEN_MAPPING. Loaded ${CoreTokenAliased.getAllTokens().length} tokens.`,
                );
            } else {
                console.warn(
                    `${logPrefix} Token mapping from NEXT_PUBLIC_TOKEN_MAPPING was processed but resulted in zero tokens. Check the JSON content.`,
                );
            }
        } catch (error) {
            console.error(
                `${logPrefix} Failed to parse token mapping from NEXT_PUBLIC_TOKEN_MAPPING. Token operations may fail or use defaults.`,
                error,
            );
        }
    } else {
        console.warn(
            `${logPrefix} NEXT_PUBLIC_TOKEN_MAPPING is not set or is empty. Token mapping not initialized from env var.`,
            "Token operations will rely on default behavior (e.g., UNKNOWN token or errors if not handled by core Token class).",
        );
    }
})();

// Export initialized version of Token, which is the initialized CoreTokenAliased.
export const Token = CoreTokenAliased;
