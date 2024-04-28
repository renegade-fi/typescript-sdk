import { getSkRoot } from "./getSkRoot.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { GET_BALANCES_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
export async function getBalances(config, parameters = {}) {
    const {} = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config);
    const walletId = utils.wallet_id(skRoot);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_BALANCES_ROUTE(walletId)));
    return res.balances;
}
//# sourceMappingURL=getBalances.js.map