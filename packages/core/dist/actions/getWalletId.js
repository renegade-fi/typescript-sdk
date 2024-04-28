import { getSkRoot } from "./getSkRoot.js";
import {} from "../createConfig.js";
export function getWalletId(config, parameters = {}) {
    const { utils } = config;
    const { seed } = parameters;
    const skRoot = getSkRoot(config, { seed });
    const walletId = utils.wallet_id(skRoot);
    return walletId;
}
//# sourceMappingURL=getWalletId.js.map