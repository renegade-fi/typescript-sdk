import { ADMIN_OPEN_ORDERS_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { BaseError, type BaseErrorType } from "../errors/base.js";
import { getRelayerWithAdmin } from "../utils/http.js";

export type GetOpenOrdersParams = {
    matchingPool?: string;
};

export type GetOpenOrdersReturnType = string[];

export type GetOpenOrdersErrorType = BaseErrorType;

export async function getOpenOrders(
    config: Config,
    parameters: GetOpenOrdersParams = {},
): Promise<GetOpenOrdersReturnType> {
    const { getBaseUrl } = config;

    const url = new URL(getBaseUrl(ADMIN_OPEN_ORDERS_ROUTE));

    if (parameters.matchingPool) {
        url.searchParams.set("matching_pool", parameters.matchingPool);
    }

    const res = await getRelayerWithAdmin(config, url.toString());

    if (!res.orders) {
        throw new BaseError("No orders found");
    }
    return res.orders;
}
