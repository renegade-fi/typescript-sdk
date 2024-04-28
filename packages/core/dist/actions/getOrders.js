import { getSkRoot } from "./getSkRoot.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { WALLET_ORDERS_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
export async function getOrders(config, parameters = {}) {
    const {} = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config);
    const walletId = utils.wallet_id(skRoot);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)));
    return res.orders;
}
//# sourceMappingURL=getOrders.js.map