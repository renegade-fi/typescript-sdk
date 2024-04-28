import { getSkRoot } from "./getSkRoot.js"

import { getRelayerWithAuth } from "../utils/http.js"

import { WALLET_ORDERS_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import type { Order } from "../types/wallet.js"

export type GetOrdersParameters = {}

export type GetOrdersReturnType = Promise<Order[]>

export async function getOrders(
    config: Config,
    parameters: GetOrdersParameters = {},
): GetOrdersReturnType {
    const {} = parameters
    const { getRelayerBaseUrl, utils } = config
    const skRoot = getSkRoot(config)
    const walletId = utils.wallet_id(skRoot)
    const res = await getRelayerWithAuth(config, getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)))
    return res.orders
}
