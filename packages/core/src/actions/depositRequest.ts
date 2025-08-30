import { DEPOSIT_BALANCE_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type DepositRequestParameters = { request: string };

export type DepositRequestReturnType = { taskId: string };

export type DepositRequestErrorType = BaseErrorType;

export async function depositRequest(
    config: Config,
    parameters: DepositRequestParameters,
): Promise<DepositRequestReturnType> {
    const { request } = parameters;
    const { getBaseUrl } = config;

    const walletId = getWalletId(config);
    const logger = config.getLogger("core:actions:depositRequest");

    try {
        const res = await postRelayerWithAuth(
            config,
            getBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
            request,
        );
        logger.debug(`task update-wallet(${res.task_id})`, { walletId, taskId: res.task_id });
        return { taskId: res.task_id };
    } catch (error) {
        logger.error(
            `Deposit request failed: ${error instanceof Error ? error.message : String(error)}`,
            { walletId },
        );
        throw error;
    }
}
