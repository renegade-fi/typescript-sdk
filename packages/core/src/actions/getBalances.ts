import { GET_BALANCES_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import type { Balance } from "../types/wallet.js";
import { getRelayerWithAuth } from "../utils/http.js";
import { getWalletId } from "./getWalletId.js";

export type GetBalancesReturnType = Promise<Balance[]>;

export async function getBalances(config: Config): GetBalancesReturnType {
    const { getBaseUrl } = config;
    const walletId = getWalletId(config);
    const res = await getRelayerWithAuth(config, getBaseUrl(GET_BALANCES_ROUTE(walletId)));
    return res.balances;
}
