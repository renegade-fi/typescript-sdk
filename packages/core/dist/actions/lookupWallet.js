import { getSkRoot } from "./getSkRoot.js";
import { getWalletFromRelayer } from "./getWalletFromRelayer.js";
import { waitForTaskCompletion } from "./waitForTaskCompletion.js";
import { parseAbiItem } from "viem";
import { publicClient } from "../utils/chain.js";
import { postRelayerRaw } from "../utils/http.js";
import { FIND_WALLET_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
export async function lookupWallet(config, parameters = {}) {
    const { seed } = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const skRoot = getSkRoot(config, { seed });
    const body = utils.find_wallet(skRoot);
    const res = await postRelayerRaw(getRelayerBaseUrl(FIND_WALLET_ROUTE), body);
    if (res.task_id) {
        config.setState({ ...config.state, status: "looking up" });
        waitForTaskCompletion(config, { id: res.task_id }).then(async () => {
            await getWalletFromRelayer(config, { seed }).then(wallet => {
                if (wallet) {
                    config.setState({ ...config.state, status: "in relayer", id: res.wallet_id });
                    console.log(`task lookup-wallet(${res.task_id}) completed: ${res.wallet_id}`, {
                        status: "in relayer",
                        walletId: res.wallet_id,
                    });
                }
            });
        });
    }
    return { taskId: res.task_id, walletId: res.wallet_id };
}
export async function lookupWalletOnChain(config) {
    try {
        const { utils } = config;
        const skRoot = getSkRoot(config);
        const blinderShare = utils.derive_blinder_share(skRoot);
        const logs = await publicClient.getLogs({
            address: config.darkPoolAddress,
            event: parseAbiItem("event WalletUpdated(uint256 indexed wallet_blinder_share)"),
            args: {
                wallet_blinder_share: blinderShare,
            },
            fromBlock: 0n,
        });
        return logs.length > 0;
    }
    catch (error) {
        console.error(`Error looking up wallet on chain: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=lookupWallet.js.map