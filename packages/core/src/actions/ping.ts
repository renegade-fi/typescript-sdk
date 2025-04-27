import { PING_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { BaseError, type BaseErrorType } from "../errors/base.js";
import { getRelayerRaw } from "../utils/http.js";

export type GetPingReturnType = boolean;

export type GetPingErrorType = BaseErrorType;

export async function getPing(config: Config): Promise<GetPingReturnType> {
    const { getBaseUrl } = config;
    try {
        const res = await getRelayerRaw(getBaseUrl(PING_ROUTE));
        if (res?.timestamp) {
            return true;
        }
        throw new BaseError("Health check failed: Invalid response format");
    } catch (error) {
        throw new BaseError(`Health check failed: ${error}`);
    }
}
