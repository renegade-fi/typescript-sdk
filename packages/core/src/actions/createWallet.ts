import invariant from "tiny-invariant";
import { CREATE_WALLET_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import { BaseError } from "../errors/base.js";
import { postRelayerRaw } from "../utils/http.js";
import { waitForWalletIndexing } from "./waitForWalletIndexing.js";

export type CreateWalletReturnType = ReturnType<typeof waitForWalletIndexing>;

export type CreateWalletParameters = {
    blinderSeed?: string;
    shareSeed?: string;
    skMatch?: string;
};

export async function createWallet(
    config: RenegadeConfig,
    parameters: CreateWalletParameters = {},
): CreateWalletReturnType {
    const { getBaseUrl, utils } = config;
    const logger = config.getLogger("core:actions:createWallet");
    let body: string;
    const headers = {
        "Content-Type": "application/json",
    };

    if (config.renegadeKeyType === "internal") {
        const { seed } = config.state;
        invariant(seed, "seed is required");
        body = utils.create_wallet(seed);
    } else {
        const { blinderSeed, shareSeed, skMatch } = parameters;
        const { walletId, publicKey, symmetricKey } = config;
        invariant(blinderSeed, "blinderSeed is required");
        invariant(shareSeed, "shareSeed is required");
        invariant(skMatch, "skMatch is required");
        body = await utils.create_external_wallet(
            walletId,
            blinderSeed,
            shareSeed,
            publicKey,
            skMatch,
            symmetricKey,
        );
    }

    const res = await postRelayerRaw(getBaseUrl(CREATE_WALLET_ROUTE), body, headers);
    if (res.task_id) {
        if (config.renegadeKeyType === "internal") {
            config.setState((x) => ({ ...x, status: "creating wallet" }));
        }
        logger.debug(`task create-wallet(${res.task_id})`, {
            walletId: res.wallet_id,
            taskId: res.task_id,
        });
        return waitForWalletIndexing(config, {
            isLookup: false,
            onComplete: (wallet) => {
                if (config.renegadeKeyType === "internal") {
                    config.setState((x) => ({ ...x, status: "in relayer" }));
                }
                logger.debug(`task create-wallet(${res.task_id}) completed`, {
                    walletId: wallet.id,
                    taskId: res.task_id,
                });
            },
            onFailure: () => {
                logger.debug(`task create-wallet(${res.task_id}) failed`, {
                    walletId: res.wallet_id,
                });
                if (config.renegadeKeyType === "internal") {
                    config.setState({});
                }
            },
        });
    }
    return Promise.reject(new BaseError("Failed to create wallet"));
}
