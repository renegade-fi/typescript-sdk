import { getSkRoot } from "./getSkRoot.js"

import { getRelayerWithAuth } from "../utils/http.js"

import { GET_ORDER_BY_ID_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import type { Order } from "../types/wallet.js"

export type GetOrderParameters = { id: string }

export type GetOrderReturnType = Promise<Order>

export async function getOrder(config: Config, parameters: GetOrderParameters): GetOrderReturnType {
    const { id } = parameters
    const { getRelayerBaseUrl, utils } = config
    const skRoot = getSkRoot(config)
    const walletId = utils.wallet_id(skRoot)
    const res = await getRelayerWithAuth(
        config,
        getRelayerBaseUrl(GET_ORDER_BY_ID_ROUTE(walletId, id)),
    )
    return res.order
}
