import invariant from "tiny-invariant";
import type { Hex } from "viem";
import { CANCEL_ORDER_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { stringifyForWasm } from "../utils/bigJSON.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getBackOfQueueWallet } from "./getBackOfQueueWallet.js";
import { getWalletId } from "./getWalletId.js";

export type CancelOrderParameters = {
    id: string;
    newPublicKey?: Hex;
};

export type CancelOrderReturnType = { taskId: string };

export type CancelOrderErrorType = BaseErrorType;

export async function cancelOrder(
    config: RenegadeConfig,
    parameters: CancelOrderParameters,
): Promise<CancelOrderReturnType> {
    const { id, newPublicKey } = parameters;
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

    const body = await utils.cancel_order(
        seed,
        stringifyForWasm(wallet),
        id,
        newPublicKey,
        signMessage,
    );

    try {
        const res = await postRelayerWithAuth(
            config,
            getBaseUrl(CANCEL_ORDER_ROUTE(walletId, id)),
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
