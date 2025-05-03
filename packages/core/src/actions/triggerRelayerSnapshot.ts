import { ADMIN_TRIGGER_SNAPSHOT_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { postRelayerWithAdmin } from "../utils/http.js";

export async function triggerRelayerSnapshot(config: Config) {
    try {
        await postRelayerWithAdmin(config, config.getBaseUrl(ADMIN_TRIGGER_SNAPSHOT_ROUTE));
    } catch (error) {
        console.error("Failed to trigger relayer snapshot", {
            error,
        });
        throw error;
    }
}
