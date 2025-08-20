import type { RenegadeConfig } from "../createConfig.js";
import { stringifyForWasm } from "../utils/bigJSON.js";
import { getBackOfQueueWallet } from "./getBackOfQueueWallet.js";

/**
 * Compute the nullifier for the relayer's current view of the wallet.
 */
export async function getWalletNullifier(config: RenegadeConfig): Promise<bigint> {
    const wallet = await getBackOfQueueWallet(config);
    return config.utils.wallet_nullifier(stringifyForWasm(wallet));
}
