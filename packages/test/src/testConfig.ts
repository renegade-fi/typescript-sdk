import { createConfig } from "@renegade-fi/core";

import * as RustUtils from "../../react/renegade-utils/index.js";

export const config = createConfig({
    chainId: 421614,
    darkPoolAddress: "0x000000000000000000000000000000000000000",
    priceReporterUrl: "https://price-reporter.renegade.fi",
    relayerUrl: "127.0.0.1",
    utils: RustUtils,
});
