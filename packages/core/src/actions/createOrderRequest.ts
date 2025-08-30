import { WALLET_ORDERS_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { postRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type CreateOrderRequestParameters = { request: string };

export type CreateOrderRequestReturnType = { taskId: string };

export type CreateOrderRequestErrorType = BaseErrorType;

export async function createOrderRequest(
    config: Config,
    parameters: CreateOrderRequestParameters,
): Promise<CreateOrderRequestReturnType> {
    const { request } = parameters;
    const { getBaseUrl } = config;

    const walletId = getWalletId(config);
    const logger = config.getLogger("core:actions:createOrderRequest");

    try {
        const res = await postRelayerWithAuth(
            config,
            getBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
            request,
        );
        logger.debug(`task update-wallet(${res.task_id})`, { walletId, taskId: res.task_id });
        return { taskId: res.task_id };
    } catch (error) {
        logger.error(
            `Create order request failed: ${error instanceof Error ? error.message : String(error)}`,
            { walletId },
        );
        throw error;
    }
}
