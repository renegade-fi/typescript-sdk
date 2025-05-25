import type { Environment } from "@renegade-fi/core";
import { ENVIRONMENT } from "@renegade-fi/core";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { ResultAsync, errAsync, fromThrowable } from "neverthrow";
import {
    ERR_INVALID_URL,
    ERR_NO_PRICE_REPORTER_URL
} from "./constants.js";
import { HttpError, PriceReporterError } from "./error.js";
import { PriceTopic } from "./topic.js";

/**
 * A client for the price reporter
 */
export class PriceReporterClient {
    constructor(private readonly baseUrl: string) {}

    static new(env: Environment) {
        return new PriceReporterClient(`https://${env}.price-reporter.renegade.fi:3000`);
    }

    static newMainnetClient() {
        return PriceReporterClient.new(ENVIRONMENT.Mainnet);
    }

    static newTestnetClient() {
        return PriceReporterClient.new(ENVIRONMENT.Testnet);
    }

    /**
     * Get the current Renegade execution price for a specific token
     */
    public getPrice(mint: `0x${string}`): Promise<number> {
        const topic = PriceTopic.new({ base: mint });
        return this._getPriceByTopic(topic).match(
            (price) => price,
            (error) => {
                throw error;
            },
        );
    }

    /**
     * Get the current Renegade execution price for a specific token
     *
     * @returns the price or an error
     */
    public getPriceResult(mint: `0x${string}`): ResultAsync<number, PriceReporterError> {
        const topic = PriceTopic.new({ base: mint });
        return this._getPriceByTopic(topic);
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
        const topic = new PriceTopic({ exchange: exchange as any, base: address, quote });
        return this._getPriceByTopic(topic);
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

        return client.getPriceResult(address);
    }

    /**
     * Get the base URL of the price reporter
     */
    baseURL(): string {
        return this.baseUrl;
    }

    // --- Private methods ---

    private _getPriceByTopic(topic: PriceTopic): ResultAsync<number, PriceReporterError> {
        const route = `/price/${topic.toString()}`;
        return this.get<string>(route).andThen((textPrice) => {
            return fromThrowable(
                () => Number.parseFloat(textPrice),
                () => new PriceReporterError(`Failed to parse float from ${textPrice}`),
            )();
        });
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
