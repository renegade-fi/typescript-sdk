import { getRelayerWithAuth } from '../utils/http.js';
import { GET_TASK_STATUS_ROUTE } from '../constants.js';
export async function getTaskStatus(config, parameters) {
    const { id } = parameters;
    const { getRelayerBaseUrl } = config;
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_TASK_STATUS_ROUTE(id)));
    return res.status;
}
//# sourceMappingURL=getTaskStatus.js.map