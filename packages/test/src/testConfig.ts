import { createConfig } from "@renegade-fi/core"

import * as RustUtils from "../renegade-utils/index.js"

export const config = createConfig({
    relayerUrl: "127.0.0.1",
    priceReporterUrl: "https://price-reporter.renegade.fi",
    utils: RustUtils,
})
