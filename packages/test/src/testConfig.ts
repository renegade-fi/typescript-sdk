import { createConfig } from "@renegade-fi/core"

import * as RustUtils from "../renegade-utils/index.js"

export const config = createConfig({
    darkPoolAddress: "0x000000000000000000000000000000000000000",
    priceReporterUrl: "https://price-reporter.renegade.fi",
    relayerUrl: "127.0.0.1",
    rpcUrl: "https://sequencer.renegade.fi",
    utils: RustUtils,
})
