import type { RenegadeConfig } from "../createConfig.js";
import { BaseError } from "../errors/base.js";
import type { Wallet } from "../types/wallet.js";
import { getWalletFromRelayer } from "./getWalletFromRelayer.js";

export type WaitForWalletIndexParameters = {
    onComplete?: (wallet: Wallet) => void;
    onFailure?: () => void;
    timeout?: number;
    isLookup?: boolean;
};

export type WaitForWalletIndexReturnType = Promise<void>;

export async function waitForWalletIndexing(
    config: RenegadeConfig,
    parameters: WaitForWalletIndexParameters,
): WaitForWalletIndexReturnType {
    const { onComplete, onFailure, timeout = 60000, isLookup } = parameters;
    const pollingInterval = config.renegadeKeyType === "internal" ? config.pollingInterval : 5000;

    const startTime = Date.now();

    while (true) {
        if (Date.now() - startTime >= timeout) {
            onFailure?.();
            throw new BaseError(`Timed out while ${isLookup ? "looking up" : "creating"} wallet`);
        }

        try {
            const wallet = await getWalletFromRelayer(config);
            if (wallet) {
                onComplete?.(wallet);
                break;
            }
        } catch (_) {
            // Do nothing, just continue the loop
        }

        // Sleep for a bit before polling again
        await new Promise((resolve) => setTimeout(resolve, pollingInterval / 2));
    }
}
