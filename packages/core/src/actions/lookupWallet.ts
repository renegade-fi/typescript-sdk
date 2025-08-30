import invariant from "tiny-invariant";
import { parseAbiItem } from "viem";
import { FIND_WALLET_ROUTE } from "../constants.js";
import type { Config, RenegadeConfig } from "../createConfig.js";
import { BaseError } from "../errors/base.js";
import { postRelayerRaw } from "../utils/http.js";
import { waitForWalletIndexing } from "./waitForWalletIndexing.js";

export type LookupWalletReturnType = ReturnType<typeof waitForWalletIndexing>;

export type LookupWalletParameters = {
    blinderSeed?: string;
    shareSeed?: string;
    skMatch?: string;
};

export async function lookupWallet(
    config: RenegadeConfig,
    parameters: LookupWalletParameters = {},
): LookupWalletReturnType {
    const { getBaseUrl, utils } = config;
    const logger = config.getLogger("core:actions:lookupWallet");
    let body: string;

    if (config.renegadeKeyType === "internal") {
        const { seed } = config.state;
        invariant(seed, "seed is required");
        body = utils.find_wallet(seed);
    } else {
        const { blinderSeed, shareSeed, skMatch } = parameters;
        const { walletId, publicKey, symmetricKey } = config;
        invariant(blinderSeed, "blinderSeed is required");
        invariant(shareSeed, "shareSeed is required");
        invariant(skMatch, "skMatch is required");
        body = await utils.find_external_wallet(
            walletId,
            blinderSeed,
            shareSeed,
            publicKey,
            skMatch,
            symmetricKey,
        );
    }
    const res = await postRelayerRaw(getBaseUrl(FIND_WALLET_ROUTE), body);

    if (res.task_id) {
        logger.debug(`task lookup-wallet(${res.task_id})`, {
            walletId: res.wallet_id,
            taskId: res.task_id,
        });
        if (config.renegadeKeyType === "internal") {
            config.setState((x) => ({ ...x, status: "looking up" }));
        }
        return waitForWalletIndexing(config, {
            timeout: 300000,
            isLookup: true,
            onComplete(wallet) {
                if (config.renegadeKeyType === "internal") {
                    config.setState((x) => ({
                        ...x,
                        status: "in relayer",
                    }));
                }
                logger.debug(`task lookup-wallet(${res.task_id}) completed`, {
                    walletId: wallet.id,
                    taskId: res.task_id,
                });
            },
            onFailure() {
                logger.debug(`task lookup-wallet(${res.task_id}) failed`, {
                    walletId: res.wallet_id,
                    taskId: res.task_id,
                });
                if (config.renegadeKeyType === "internal") {
                    config.setState({});
                }
            },
        });
    }
    return Promise.reject(new BaseError("Failed to lookup wallet"));
}

// Returns true iff the query successfully returns 0 logs
export async function checkForWalletUpdatesOnChain(config: Config) {
    const logger = config.getLogger("core:actions:lookupWallet:checkForWalletUpdatesOnChain");
    try {
        const {
            utils,
            state: { seed },
        } = config;
        invariant(seed, "Seed is required");
        const blinderShare = utils.derive_blinder_share(seed);

        const logs = await config.viemClient.getLogs({
            address: config.darkPoolAddress,
            event: parseAbiItem("event WalletUpdated(uint256 indexed wallet_blinder_share)"),
            args: {
                wallet_blinder_share: blinderShare,
            },
            fromBlock: BigInt(process.env.FROM_BLOCK || process.env.NEXT_PUBLIC_FROM_BLOCK || 0),
        });
        return logs.length === 0;
    } catch (error) {
        logger.error(
            `Error looking up wallet on chain: ${error instanceof Error ? error.message : String(error)}`,
            {},
        );
        return false;
    }
}
