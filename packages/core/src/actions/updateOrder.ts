import invariant from "tiny-invariant";
import { type Address, type Hex, toHex } from "viem";
import { UPDATE_ORDER_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
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
    newPublicKey?: Hex;
};

export type UpdateOrderReturnType = Promise<{ taskId: string }>;

export async function updateOrder(
    config: RenegadeConfig,
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
        newPublicKey,
    } = parameters;
    const { getBaseUrl, utils, renegadeKeyType } = config;

    const walletId = getWalletId(config);
    const wallet = await getBackOfQueueWallet(config);

    const seed = renegadeKeyType === "internal" ? config.state.seed : undefined;
    const signMessage = renegadeKeyType === "external" ? config.signMessage : undefined;

    if (renegadeKeyType === "external") {
        invariant(
            signMessage !== undefined,
            "Sign message function is required for external key type",
        );
    }
    if (renegadeKeyType === "internal") {
        invariant(seed !== undefined, "Seed is required for internal key type");
    }

    const body = await utils.update_order(
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
        newPublicKey,
        signMessage,
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
