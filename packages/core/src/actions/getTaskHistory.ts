import { getHseBaseUrl } from "../chains/defaults.js";
import { TASK_HISTORY_LEN_PARAM, TASK_HISTORY_ROUTE } from "../constants.js";
import type { RenegadeConfig } from "../createConfig.js";
import { BaseError, type BaseErrorType } from "../errors/base.js";
import type { Task as TaskHistoryItem } from "../types/task.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type GetTaskHistoryParameters = {
    limit?: number;
};

export type GetTaskHistoryReturnType = Map<string, TaskHistoryItem>;

export type GetTaskHistoryErrorType = BaseErrorType;

export async function getTaskHistory(
    config: RenegadeConfig,
    parameters: GetTaskHistoryParameters = {},
): Promise<GetTaskHistoryReturnType> {
    const { limit } = parameters;
    const walletId = getWalletId(config);
    let url = `${getHseBaseUrl(config.chainId)}/v0${TASK_HISTORY_ROUTE(walletId)}`;

    if (limit !== undefined) {
        const searchParams = new URLSearchParams({
            [TASK_HISTORY_LEN_PARAM]: limit.toString(),
        });
        url += `?${searchParams.toString()}`;
    }
    const res = await getRelayerWithAuth(config, url);

    if (!res.tasks) {
        throw new BaseError("No tasks found");
    }
    return new Map(res.tasks.map((task: TaskHistoryItem) => [task.id, task]));
}
