import { getSkRoot } from './getSkRoot.js';
import { getRelayerWithAuth } from '../utils/http.js';
import { ORDER_HISTORY_ROUTE } from '../constants.js';
export async function getOrderHistory(config) {
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config);
    const walletId = utils.wallet_id(skRoot);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(ORDER_HISTORY_ROUTE(walletId)));
    return res.orders;
}
//# sourceMappingURL=getOrderHistory.js.map