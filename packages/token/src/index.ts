import { type Exchange, getSDKConfig } from "@renegade-fi/core";

type Address = `0x${string}`;

type TokenMetadata = {
    name: string;
    ticker: string;
    address: Address;
    decimals: number;
    supported_exchanges: Partial<Record<Exchange, string>>;
    chain_addresses: Record<string, string>;
    logo_url: string;
};

type TokenMapping = {
    tokens: TokenMetadata[];
};

/** The zero address */
const zeroAddress = "0x0000000000000000000000000000000000000000";

/* The base URL for raw token remap files */
const REMAP_BASE_URL = "https://raw.githubusercontent.com/renegade-fi/token-mappings/main/";

/** The list of stablecoins */
export const STABLECOINS = ["USDC", "USDT"];

/** The token class */
export class Token {
    private static tokenMapping: TokenMapping;

    /** Fetch a remap from the repo */
    static async fetchRemapFromRepo(chain: number) {
        const name = getSDKConfig(chain).environment;
        const url = new URL(`${REMAP_BASE_URL}${name}.json`);
        const res = await fetch(url);
        const data = (await res.json()) as TokenMapping;
        Token.processRemap(data.tokens);
    }

    /** Parse a remap from a stringified JSON object */
    static parseRemapFromString(remap: string) {
        const data = JSON.parse(remap) as TokenMapping;
        Token.processRemap(data.tokens);
    }

    private static processRemap(tokens: TokenMetadata[]) {
        Token.tokenMapping = {
            tokens: [],
        };

        // Lowercase all addresses in the remap
        const lowercaseTokens = tokens.map(
            (token) =>
                ({
                    ...token,
                    address: token.address.toLowerCase() as Address,
                    supported_exchanges: Object.fromEntries(
                        Object.entries(token.supported_exchanges).map(([k, v]) => [
                            // Lowercase all of the exchange names to match the Exchange enum
                            k.toLowerCase(),
                            v,
                        ]),
                    ),
                }) as const satisfies TokenMetadata,
        );

        Token.tokenMapping = {
            tokens: lowercaseTokens,
        };
    }

    private _name: string;
    private _ticker: string;
    private _address: Address;
    private _decimals: number;
    private _supported_exchanges: Partial<Record<Exchange, string>>;
    private _chain_addresses: Record<string, string>;
    private _logo_url: string;

    constructor(tokenMetadata: TokenMetadata) {
        this._name = tokenMetadata.name;
        this._ticker = tokenMetadata.ticker;
        this._address = tokenMetadata.address;
        this._decimals = tokenMetadata.decimals;
        this._supported_exchanges = tokenMetadata.supported_exchanges;
        this._chain_addresses = tokenMetadata.chain_addresses;
        this._logo_url = tokenMetadata.logo_url;
    }

    get name(): string {
        return this._name;
    }

    get ticker(): string {
        return this._ticker;
    }

    get address(): Address {
        return this._address;
    }

    get decimals(): number {
        return this._decimals;
    }

    get supportedExchanges(): Set<Exchange> {
        return new Set(Object.keys(this._supported_exchanges)) as Set<Exchange>;
    }

    get rawSupportedExchanges(): Partial<Record<Exchange, string>> {
        return this._supported_exchanges;
    }

    get chainAddresses(): Record<string, string> {
        return this._chain_addresses;
    }

    get logoUrl(): string {
        return this._logo_url;
    }

    getExchangeTicker(exchange: Exchange): string | undefined {
        return this._supported_exchanges[exchange];
    }

    isStablecoin(): boolean {
        return STABLECOINS.includes(this.ticker);
    }

    /// Converts the amount of the token, accounting for the
    /// associated number of decimals.
    convertToDecimal(amount: bigint): number {
        return formatUnits(amount, this.decimals);
    }

    static fromTicker(ticker: string): Token {
        if (Token.tokenMapping.tokens.length === 0) {
            throw new Error("Token not initialized. Call fetchRemapFromRepo first.");
        }

        const tokenData = Token.tokenMapping.tokens.find((token) => token.ticker === ticker);
        if (!tokenData) {
            return DEFAULT_TOKEN;
        }
        return new Token(tokenData);
    }

    /** @deprecated Use `Token.fromTicker` instead */
    static findByTicker(ticker: string): Token {
        return Token.fromTicker(ticker);
    }

    static fromAddress(address: Address): Token {
        if (Token.tokenMapping.tokens.length === 0) {
            throw new Error("Token not initialized. Call fetchRemapFromRepo first.");
        }

        const tokenData = Token.tokenMapping.tokens.find(
            (token) => token.address.toLowerCase() === address.toLowerCase(),
        );
        if (!tokenData) {
            return DEFAULT_TOKEN;
        }
        return new Token(tokenData);
    }

    /** @deprecated Use `Token.fromAddress` instead */
    static findByAddress(address: Address): Token {
        return Token.fromAddress(address);
    }

    static create(
        name: string,
        ticker: string,
        address: Address,
        decimals: number,
        supported_exchanges: Partial<Record<Exchange, string>> = {},
        chain_addresses: Record<string, string> = {},
        logo_url = "",
    ): Token {
        return new Token({
            name,
            ticker,
            address,
            decimals,
            supported_exchanges,
            chain_addresses,
            logo_url,
        });
    }

    static getAllTokens(): Token[] {
        return Token.tokenMapping.tokens.map((token) => new Token(token));
    }
}

const DEFAULT_TOKEN = Token.create("UNKNOWN", "UNKNOWN", zeroAddress, 0);

export function getDefaultQuoteToken(exchange: Exchange): Token {
    switch (exchange) {
        case "binance":
            return Token.fromTicker("USDT");
        case "coinbase":
            return Token.fromTicker("USDC");
        case "kraken":
            return Token.create(
                "USD Coin",
                "USDC",
                "0x0000000000000000000000000000000000000000",
                6,
                { kraken: "USD" },
            );
        case "okx":
            return Token.findByTicker("USDT");
    }
}

/**
 * Formats a bigint value as a string with the specified number of decimals.
 *
 * From https://github.com/wevm/viem/blob/main/src/utils/unit/formatUnits.ts
 */
export function formatUnits(value: bigint, decimals: number) {
    let display = value.toString();

    const negative = display.startsWith("-");
    if (negative) display = display.slice(1);

    display = display.padStart(decimals, "0");

    let [integer, fraction] = [
        display.slice(0, display.length - decimals),
        display.slice(display.length - decimals),
    ];
    fraction = fraction.replace(/(0+)$/, "");
    return Number.parseFloat(
        `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`,
    );
}
