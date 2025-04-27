import type { Address } from "viem";
import { PRICE_REPORTER_ROUTE } from "../constants.js";
import type { Config } from "../createConfig.js";
import { getDefaultQuoteToken } from "../types/token.js";
import type { Exchange } from "../types/wallet.js";
import { getRelayerRaw } from "../utils/http.js";

export type GetPriceParameters = {
    exchange?: Exchange;
    base: Address;
    quote?: Address;
};

export type GetPriceReturnType = Promise<number>;

export async function getPriceFromPriceReporter(
    config: Config,
    parameters: GetPriceParameters,
): GetPriceReturnType {
    const {
        exchange = "binance",
        base,
        quote = getDefaultQuoteToken(exchange).address,
    } = parameters;
    const { getPriceReporterHTTPBaseUrl } = config;

    const res = await getRelayerRaw(
        getPriceReporterHTTPBaseUrl(PRICE_REPORTER_ROUTE(exchange, base, quote)),
    );
    return res;
}
