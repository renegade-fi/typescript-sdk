import { createConfig as core_createConfig } from "@renegade-fi/core";
import * as RustUtils from "../renegade-utils/index.js";
function createConfig(...args) {
    const config = core_createConfig({
        ...args[0],
        utils: RustUtils,
    });
    return config;
}
export { createConfig };
//# sourceMappingURL=index.js.map