import { ADMIN_TRIGGER_SNAPSHOT_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { postRelayerWithAdmin } from "../utils/http.js";

export async function triggerRelayerSnapshot(config: Config) {
    const logger = config.getLogger("core:actions:triggerRelayerSnapshot");
    try {
        await postRelayerWithAdmin(config, config.getBaseUrl(ADMIN_TRIGGER_SNAPSHOT_ROUTE));
    } catch (error) {
        logger.error(
            `Failed to trigger relayer snapshot: ${error instanceof Error ? error.message : String(error)}`,
            {},
        );
        throw error;
    }
}
