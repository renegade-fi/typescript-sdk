import { getSkRoot } from './getSkRoot.js';
import { waitForTaskCompletion } from './waitForTaskCompletion.js';
import { postRelayerRaw } from '../utils/http.js';
import { CREATE_WALLET_ROUTE } from '../constants.js';
export async function createWallet(config) {
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config);
    const body = utils.create_wallet(skRoot);
    const headers = {
        'Content-Type': 'application/json',
    };
    const res = await postRelayerRaw(getRelayerBaseUrl(CREATE_WALLET_ROUTE), body, headers);
    if (res.task_id) {
        config.setState({ ...config.state, status: 'creating wallet' });
        waitForTaskCompletion(config, { id: res.task_id }).then(() => {
            config.setState({
                ...config.state,
                id: res.wallet_id,
                status: 'in relayer',
            });
        });
    }
    return { walletId: res.wallet_id, taskId: res.task_id };
}
//# sourceMappingURL=createWallet.js.map