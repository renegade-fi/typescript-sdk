export const ERR_NO_PRICE_REPORTER_URL = "PRICE_REPORTER_URL environment variable is not set";
export const ERR_INVALID_URL = "PRICE_REPORTER_URL must be a valid URL including protocol and port";

/**
 * @param exchange - The exchange to fetch the price from
 * @param base - The base token to fetch the price for
 * @param quote - The quote token to fetch the price for
 * @returns The topic name for a given pair
 */
const PRICE_REPORTER_TOPIC = (exchange: string, base: string, quote: string) =>
    `${exchange}-${base.toLowerCase()}-${quote.toLowerCase()}`;

/**
 * @param exchange - The exchange to fetch the price from
 * @param base - The base token to fetch the price for
 * @param quote - The quote token to fetch the price for
 * @returns The HTTP GET route to fetch the price from the price reporter
 */
export const PRICE_REPORTER_ROUTE = (exchange: string, base: string, quote: string) =>
    `/price/${PRICE_REPORTER_TOPIC(exchange, base, quote)}`;

/**
 * The alias for the canonical exchange
 */
export const RENEGADE_EXCHANGE = "renegade";

/**
 * @param base - The base token to fetch the price for
 * @returns The topic name for the Renegade price of a given token
 */
const RENEGADE_PRICE_TOPIC = (base: string) => `${RENEGADE_EXCHANGE}-${base.toLowerCase()}`;

/**
 * @param base - The base token to fetch the price for
 * @returns The HTTP GET route to fetch the price from the price reporter
 */
export const RENEGADE_PRICE_ROUTE = (base: string) => `/price/${RENEGADE_PRICE_TOPIC(base)}`;
