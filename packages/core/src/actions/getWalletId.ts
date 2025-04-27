import invariant from "tiny-invariant";
import type { RenegadeConfig } from "../createConfig.js";

export type GetWalletIdReturnType = string;

export function getWalletId(config: RenegadeConfig): GetWalletIdReturnType {
    if (config.renegadeKeyType === "external") {
        return config.walletId;
    }
    const {
        utils,
        state: { seed },
    } = config;
    invariant(seed, "seed is required");
    const walletId = utils.wallet_id(seed);
    return walletId;
}
