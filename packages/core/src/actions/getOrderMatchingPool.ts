import { ADMIN_GET_ORDER_MATCHING_POOL_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { getRelayerWithAdmin } from "../utils/http.js";

export type GetOrderMatchingPoolParameters = {
    orderId: string;
};

export type GetOrderMatchingPoolReturnType = string;

export async function getOrderMatchingPool(
    config: Config,
    parameters: GetOrderMatchingPoolParameters,
): Promise<GetOrderMatchingPoolReturnType> {
    const { orderId } = parameters;
    const { getBaseUrl } = config;
    const logger = config.getLogger("core:actions:getOrderMatchingPool");

    try {
        const res = await getRelayerWithAdmin(
            config,
            getBaseUrl(ADMIN_GET_ORDER_MATCHING_POOL_ROUTE(orderId)),
        );

        return res.matching_pool;
    } catch (error) {
        logger.error(
            `Failed to get matching pool: ${error instanceof Error ? error.message : String(error)}`,
            { orderId },
        );

        throw error;
    }
}
