import { ADMIN_MATCHING_POOL_CREATE_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { postRelayerWithAdmin } from "../utils/http.js";

export type CreateMatchingPoolParameters = {
    matchingPool: string;
};

export async function createMatchingPool(config: Config, parameters: CreateMatchingPoolParameters) {
    const { matchingPool } = parameters;
    const { getBaseUrl } = config;
    const logger = config.getLogger("core:actions:createMatchingPool");

    try {
        await postRelayerWithAdmin(
            config,
            getBaseUrl(ADMIN_MATCHING_POOL_CREATE_ROUTE(matchingPool)),
        );
    } catch (error) {
        logger.error(
            `Failed to create matching pool: ${error instanceof Error ? error.message : String(error)}`,
            { matchingPool },
        );
        throw error;
    }
}
