import { CHAIN_IDS, type ChainId, getSDKConfig } from "@renegade-fi/core";
import { getDefaultQuoteToken } from "@renegade-fi/token";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { ResultAsync, okAsync } from "neverthrow";
import { PRICE_REPORTER_ROUTE } from "./constants.js";
import { HttpError, type PriceReporterError } from "./error.js";

export class PriceReporterClient {
    constructor(private readonly baseUrl: string) {}

    static new(chainId: ChainId) {
        const config = getSDKConfig(chainId);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    static newArbitrumMainnetClient() {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumMainnet);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    static newArbitrumSepoliaClient() {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumSepolia);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    /**
     * Get the price of a token from a given exchange
     */
    public getPrice(
        exchange: string,
        address: `0x${string}`,
        quote: `0x${string}`,
    ): ResultAsync<number, PriceReporterError> {
        const route = PRICE_REPORTER_ROUTE(exchange, address, quote);
        return this.get<string>(route).andThen((textPrice) => {
            const price = Number(textPrice);
            return okAsync(price);
        });
    }

    /**
     * Get the price of a token from Binance
     */
    public getBinancePrice(address: `0x${string}`): ResultAsync<number, PriceReporterError> {
        const exchange = "binance";
        const quote = getDefaultQuoteToken(exchange).address;
        return this.getPrice(exchange, address, quote);
    }

    private get<T>(route: string): ResultAsync<T, PriceReporterError> {
        const url = new URL(route, this.baseUrl);
        const endpointUrl = url.toString();

        const config: AxiosRequestConfig = {
            method: "GET",
            url: endpointUrl,
        };

        const safeRequest = ResultAsync.fromThrowable(
            () => axios.request<T>(config),
            (error) => new HttpError(error, endpointUrl, config.method || "GET"),
        );

        return safeRequest().map((response) => response.data);
    }
}
