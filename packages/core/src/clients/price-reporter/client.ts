import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { PRICE_REPORTER_ROUTE } from "../../constants.js";
import { getDefaultQuoteToken } from "../../types/token.js";
import { HttpError, PriceReporterError } from "./error.js";

const ERR_NO_PRICE_REPORTER_URL = "PRICE_REPORTER_URL environment variable is not set";
const ERR_INVALID_URL = "PRICE_REPORTER_URL must be a valid URL including protocol and port";

export class PriceReporterClient {
    constructor(private readonly baseUrl: string) {}

    /**
     * Creates a new PriceReporterClient instance
     * @returns A Result containing either a PriceReporterClient or a PriceReporterError
     */
    static new(): ResultAsync<PriceReporterClient, PriceReporterError> {
        if (!process.env.PRICE_REPORTER_URL) {
            return errAsync(new PriceReporterError(ERR_NO_PRICE_REPORTER_URL));
        }

        try {
            const baseUrl = new URL(`https://${process.env.PRICE_REPORTER_URL}:3000`);
            return ResultAsync.fromPromise(
                Promise.resolve(new PriceReporterClient(baseUrl.toString())),
                (err: unknown) =>
                    new PriceReporterError(err instanceof Error ? err.message : String(err)),
            );
        } catch {
            return errAsync(new PriceReporterError(ERR_INVALID_URL));
        }
    }

    static getBinancePrice(address: `0x${string}`): ResultAsync<number, PriceReporterError> {
        const exchange = "binance";
        const quote = getDefaultQuoteToken(exchange).address;

        return PriceReporterClient.new().andThen((client) =>
            client.getPrice(exchange, address, quote),
        );
    }

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
