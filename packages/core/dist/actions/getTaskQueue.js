import { getWalletId } from './getWalletId.js';
import { getRelayerWithAuth } from '../utils/http.js';
import { GET_TASK_QUEUE_ROUTE } from '../constants.js';
export async function getTaskQueue(config) {
    const { getRelayerBaseUrl } = config;
    const walletId = getWalletId(config);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_TASK_QUEUE_ROUTE(walletId)));
    return res.tasks;
}
//# sourceMappingURL=getTaskQueue.js.map