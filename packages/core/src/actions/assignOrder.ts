import { ADMIN_ASSIGN_ORDER_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { postRelayerWithAdmin } from "../utils/http.js";

export type AssignOrderParameters = {
    orderId: string;
    matchingPool: string;
};

export async function assignOrder(config: Config, parameters: AssignOrderParameters) {
    const { orderId, matchingPool } = parameters;
    const { getBaseUrl } = config;
    const logger = config.getLogger("core:actions:assignOrder");

    try {
        await postRelayerWithAdmin(
            config,
            getBaseUrl(ADMIN_ASSIGN_ORDER_ROUTE(orderId, matchingPool)),
        );
    } catch (error) {
        logger.error(
            `Failed to assign order to matching pool: ${error instanceof Error ? error.message : String(error)}`,
            { orderId, matchingPool },
        );
        throw error;
    }
}
