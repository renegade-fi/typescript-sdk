import { getRelayerRaw } from "../utils/http.js";
import { GET_NETWORK_ORDERS_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
export async function getNetworkOrders(config, parameters = {}) {
    const {} = parameters;
    const { getRelayerBaseUrl } = config;
    const res = await getRelayerRaw(getRelayerBaseUrl(GET_NETWORK_ORDERS_ROUTE));
    return res.orders;
}
//# sourceMappingURL=getNetworkOrders.js.map