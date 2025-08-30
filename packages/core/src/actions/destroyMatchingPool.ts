import { ADMIN_MATCHING_POOL_DESTROY_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { postRelayerWithAdmin } from "../utils/http.js";

export type DestroyMatchingPoolParameters = {
    matchingPool: string;
};

export async function destroyMatchingPool(
    config: Config,
    parameters: DestroyMatchingPoolParameters,
) {
    const { matchingPool } = parameters;
    const { getBaseUrl } = config;
    const logger = config.getLogger("core:actions:destroyMatchingPool");

    try {
        await postRelayerWithAdmin(
            config,
            getBaseUrl(ADMIN_MATCHING_POOL_DESTROY_ROUTE(matchingPool)),
        );
    } catch (error) {
        logger.error(
            `Failed to destroy matching pool: ${error instanceof Error ? error.message : String(error)}`,
            { matchingPool },
        );
        throw error;
    }
}
