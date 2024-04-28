import type { Config } from "../createConfig.js";
export type GetAuthorizationHeadersParameters = {
    message: string;
};
export type GetAuthorizationHeadersReturnType = [string, string];
export declare const getAuthorizationHeaders: (config: Config, parameters: GetAuthorizationHeadersParameters) => GetAuthorizationHeadersReturnType;
//# sourceMappingURL=getAuthHeaders.d.ts.map