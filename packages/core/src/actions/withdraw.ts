import invariant from "tiny-invariant";
import { type Address, toHex } from "viem";
import { CHAIN_SPECIFIERS, WITHDRAW_BALANCE_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import { stringifyForWasm } from "../utils/bigJSON.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getBackOfQueueWallet } from "./getBackOfQueueWallet.js";
import { getWalletId } from "./getWalletId.js";

export type WithdrawParameters = {
    mint: Address;
    amount: bigint;
    destinationAddr: Address;
    newPublicKey?: string;
};

export type WithdrawReturnType = Promise<{ taskId: string }>;

export async function withdraw(
    config: RenegadeConfig,
    parameters: WithdrawParameters,
): WithdrawReturnType {
    const { mint, amount, destinationAddr, newPublicKey } = parameters;
    const { getBaseUrl, utils, renegadeKeyType } = config;
    const logger = config.getLogger("core:actions:withdraw");

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

    const chain = CHAIN_SPECIFIERS[config.chainId];

    const body = await utils.withdraw(
        chain,
        seed,
        stringifyForWasm(wallet),
        mint,
        toHex(amount),
        destinationAddr,
        newPublicKey,
        signMessage,
    );

    try {
        const res = await postRelayerWithAuth(
            config,
            getBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
            body,
        );
        logger.debug(`task update-wallet(${res.task_id})`, { walletId, taskId: res.task_id });
        return { taskId: res.task_id };
    } catch (error) {
        logger.error(`Withdraw failed: ${error instanceof Error ? error.message : String(error)}`, {
            walletId,
        });
        throw error;
    }
}
