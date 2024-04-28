import { getWalletId } from "./getWalletId.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { GET_TASK_QUEUE_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
export async function getTaskQueue(config, parameters = {}) {
    const {} = parameters;
    const { getRelayerBaseUrl } = config;
    const walletId = getWalletId(config);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_TASK_QUEUE_ROUTE(walletId)));
    return res.tasks;
}
//# sourceMappingURL=getTaskQueue.js.map