import { getSkRoot } from './getSkRoot.js';
import { getRelayerWithAuth } from '../utils/http.js';
import { GET_WALLET_ROUTE } from '../constants.js';
export async function getWalletFromRelayer(config, parameters = {}) {
    const { seed } = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config, { seed });
    const walletId = utils.wallet_id(skRoot);
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_WALLET_ROUTE(walletId)));
    if (res.wallet) {
        config.setState({
            ...config.state,
            status: 'in relayer',
            id: res.wallet.id,
        });
        return res.wallet;
    }
    return;
}
//# sourceMappingURL=getWalletFromRelayer.js.map