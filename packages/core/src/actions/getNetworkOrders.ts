import { getRelayerRaw } from "../utils/http.js"

import { GET_NETWORK_ORDERS_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import type { NetworkOrder } from "../types/wallet.js"

export type GetNetworkOrdersParameters = {}

export type GetNetworkOrdersReturnType = Promise<NetworkOrder[]>

export async function getNetworkOrders(
    config: Config,
    parameters: GetNetworkOrdersParameters = {},
): GetNetworkOrdersReturnType {
    const {} = parameters
    const { getRelayerBaseUrl } = config
    const res = await getRelayerRaw(getRelayerBaseUrl(GET_NETWORK_ORDERS_ROUTE))
    return res.orders
}
