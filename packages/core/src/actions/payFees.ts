import { PAY_FEES_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import type { BaseError } from "../errors/base.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type PayFeesReturnType = { taskIds: string[] };

export type PayFeesErrorType = BaseError;

export async function payFees(config: RenegadeConfig): Promise<PayFeesReturnType> {
    const { getBaseUrl } = config;
    const walletId = getWalletId(config);
    const logger = config.getLogger("core:actions:payFees");

    try {
        const res = await postRelayerWithAuth(config, getBaseUrl(PAY_FEES_ROUTE(walletId)));
        if (res?.task_ids) {
            for (const id of res.task_ids) {
                logger.debug(`task pay-fees(${id}): ${walletId}`, {
                    walletId,
                    taskId: id,
                });
            }
        }
        return { taskIds: res.task_ids };
    } catch (error) {
        logger.error(`Pay fees failed: ${error instanceof Error ? error.message : String(error)}`, {
            walletId,
        });
        throw error;
    }
}
