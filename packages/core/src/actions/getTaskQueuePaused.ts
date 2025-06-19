import { GET_TASK_QUEUE_PAUSED_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type GetTaskQueuePausedReturnType = boolean;

export async function getTaskQueuePaused(
    config: RenegadeConfig,
): Promise<GetTaskQueuePausedReturnType> {
    const { getBaseUrl } = config;
    const walletId = getWalletId(config);
    const res = await getRelayerWithAuth(config, getBaseUrl(GET_TASK_QUEUE_PAUSED_ROUTE(walletId)));
    return res.is_paused;
}
