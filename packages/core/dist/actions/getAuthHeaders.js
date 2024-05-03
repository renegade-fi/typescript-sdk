import { getSkRoot } from './getSkRoot.js';
export const getAuthorizationHeaders = (config, parameters) => {
    const { message } = parameters;
    const { utils } = config;
    const skRoot = getSkRoot(config);
    return utils.build_auth_headers(skRoot, message, BigInt(Date.now()));
};
//# sourceMappingURL=getAuthHeaders.js.map