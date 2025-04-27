import invariant from "tiny-invariant";
import { type Address, toHex } from "viem";
import { UPDATE_ORDER_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { stringifyForWasm } from "../utils/bigJSON.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getBackOfQueueWallet } from "./getBackOfQueueWallet.js";
import { getWalletId } from "./getWalletId.js";

export type UpdateOrderParameters = {
    id?: string;
    base: Address;
    quote: Address;
    side: "buy" | "sell";
    amount: bigint;
    worstCasePrice?: string;
    minFillSize?: bigint;
    allowExternalMatches?: boolean;
};

export type UpdateOrderReturnType = Promise<{ taskId: string }>;

export async function updateOrder(
    config: Config,
    parameters: UpdateOrderParameters,
): UpdateOrderReturnType {
    const {
        id = "",
        base,
        quote,
        side,
        amount,
        worstCasePrice = "",
        minFillSize = BigInt(0),
        allowExternalMatches = false,
    } = parameters;
    const {
        getBaseUrl,
        utils,
        state: { seed },
    } = config;
    invariant(seed, "Seed is required");

    const walletId = getWalletId(config);
    const wallet = await getBackOfQueueWallet(config);

    const body = utils.update_order(
        seed,
        stringifyForWasm(wallet),
        id,
        base,
        quote,
        side,
        toHex(amount),
        worstCasePrice,
        toHex(minFillSize),
        allowExternalMatches,
    );

    try {
        const res = await postRelayerWithAuth(
            config,
            getBaseUrl(UPDATE_ORDER_ROUTE(walletId, id)),
            body,
        );
        console.log(`task update-wallet(${res.task_id}): ${walletId}`);
        return { taskId: res.task_id };
    } catch (error) {
        console.error(`${walletId}`, {
            error,
        });
        throw error;
    }
}
