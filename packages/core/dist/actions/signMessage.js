import { getSkRoot } from "./getSkRoot.js";
export const signMessage = (config, parameters) => {
    const { message } = parameters;
    const { utils } = config;
    return `0x${utils.sign_message(getSkRoot(config), message)}`;
};
//# sourceMappingURL=signMessage.js.map