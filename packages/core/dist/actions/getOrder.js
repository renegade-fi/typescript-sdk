import { getSkRoot } from './getSkRoot.js';
import { getRelayerWithAuth } from '../utils/http.js';
import { GET_ORDER_BY_ID_ROUTE } from '../constants.js';
export async function getOrder(config, parameters) {
    const { id } = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config);
    const walletId = utils.wallet_id(skRoot);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_ORDER_BY_ID_ROUTE(walletId, id)));
    return res.order;
}
//# sourceMappingURL=getOrder.js.map