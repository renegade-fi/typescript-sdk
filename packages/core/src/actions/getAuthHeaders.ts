import { getSkRoot } from "./getSkRoot.js"

import type { Config } from "../createConfig.js"

export type GetAuthorizationHeadersParameters = {
    message: string
}
export type GetAuthorizationHeadersReturnType = [string, string]
export const getAuthorizationHeaders = (
    config: Config,
    parameters: GetAuthorizationHeadersParameters,
): GetAuthorizationHeadersReturnType => {
    const { message } = parameters
    const { utils } = config
    const skRoot = getSkRoot(config)
    return utils.build_auth_headers(
        skRoot,
        message,
        BigInt(Date.now()),
    ) as GetAuthorizationHeadersReturnType
}
