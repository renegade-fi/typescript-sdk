import { getSkRoot } from "./getSkRoot.js"

import { getRelayerWithAuth } from "../utils/http.js"

import { GET_BALANCES_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import type { Balance } from "../types/wallet.js"

export type GetBalancesParameters = {}

export type GetBalancesReturnType = Promise<Balance[]>

export async function getBalances(
    config: Config,
    parameters: GetBalancesParameters = {},
): GetBalancesReturnType {
    const {} = parameters
    const { getRelayerBaseUrl, utils } = config
    const skRoot = getSkRoot(config)
    const walletId = utils.wallet_id(skRoot)
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(GET_BALANCES_ROUTE(walletId)))
    return res.balances
}
