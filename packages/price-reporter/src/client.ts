import { CHAIN_IDS, getSDKConfig } from "@renegade-fi/core";
import { getDefaultQuoteToken } from "@renegade-fi/token";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { ResultAsync, errAsync, fromThrowable } from "neverthrow";
import { ERR_INVALID_URL, ERR_NO_PRICE_REPORTER_URL, PRICE_REPORTER_ROUTE } from "./constants.js";
import { HttpError, PriceReporterError } from "./error.js";

/**
 * A client for the price reporter
 */
export class PriceReporterClient {
    constructor(private readonly baseUrl: string) {}

    static new(chainId: number) {
        const config = getSDKConfig(chainId);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    static newArbitrumOneClient() {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumOne);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    static newArbitrumSepoliaClient() {
        const config = getSDKConfig(CHAIN_IDS.ArbitrumSepolia);
        return new PriceReporterClient(`https://${config.priceReporterUrl}:3000`);
    }

    /**
     * Get the current Renegade execution price for a specific token
     */
    public getPrice(mint: `0x${string}`): Promise<number> {
        const exchange = "binance";
        const quote = getDefaultQuoteToken(exchange).address;
        return this.getPriceByTopic(exchange, mint, quote);
    }

    /**
     * Get the current Renegade execution price for a specific token
     *
     * @returns the price or an error
     */
    public getPriceResult(mint: `0x${string}`): ResultAsync<number, PriceReporterError> {
        const exchange = "binance";
        const quote = getDefaultQuoteToken(exchange).address;
        return this.getPriceByTopicResult(exchange, mint, quote);
    }

    /**
     * Get the price of a token from a given exchange
     */
    public getPriceByTopic(
        exchange: string,
        address: `0x${string}`,
        quote: `0x${string}`,
    ): Promise<number> {
        return this.getPriceByTopicResult(exchange, address, quote).match(
            (price) => price,
            (error) => {
                throw error;
            },
        );
    }

    /**
     * Get the price of a token from a given exchange
     */
    public getPriceByTopicResult(
        exchange: string,
        address: `0x${string}`,
        quote: `0x${string}`,
    ): ResultAsync<number, PriceReporterError> {
        const route = PRICE_REPORTER_ROUTE(exchange, address, quote);
        return this.get<string>(route).andThen((textPrice) => {
            return fromThrowable(
                () => Number.parseFloat(textPrice),
                () => new PriceReporterError(`Failed to parse float from ${textPrice}`),
            )();
        });
    }

    /**
     * @deprecated Use `getPrice` instead
     */
    static getBinancePrice(address: `0x${string}`): ResultAsync<number, PriceReporterError> {
        if (!process.env.PRICE_REPORTER_URL) {
            return errAsync(new PriceReporterError(ERR_NO_PRICE_REPORTER_URL));
        }
        let client: PriceReporterClient;
        try {
            client = new PriceReporterClient(`https://${process.env.PRICE_REPORTER_URL}:3000`);
        } catch {
            return errAsync(new PriceReporterError(ERR_INVALID_URL));
        }

        const exchange = "binance";
        const quote = getDefaultQuoteToken(exchange).address;

        return client.getPriceByTopicResult(exchange, address, quote);
    }

    // --- Private methods ---

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
