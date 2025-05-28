import {
    CHAIN_SPECIFIERS,
    type ChainId,
    type Exchange,
    isSupportedChainId,
} from "@renegade-fi/core";

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

/**
 * The default chain. This gets set to the first chain that is added to the token mapping.
 *
 * Supports the "default" option to maintain backwards compatibility for
 * chain-agnostic initialization of the token mapping in a single-chain context
 * (i.e., `parseRemapFromString`).
 */
let DEFAULT_CHAIN: ChainId | "default" | undefined = undefined;

/** The token class */
export class Token {
    private static tokenMappings: Partial<Record<ChainId | "default", TokenMapping>> = {};

    /** Fetch a remap from the repo */
    static async fetchRemapFromRepo(chain: number) {
        if (!isSupportedChainId(chain)) {
            throw new Error(`Chain ${chain} is not supported`);
        }

        const chainSpecifier = CHAIN_SPECIFIERS[chain];
        const url = new URL(`${REMAP_BASE_URL}${chainSpecifier}.json`);
        const res = await fetch(url);
        const data = (await res.json()) as TokenMapping;
        Token.addRemap(chain, data.tokens);
    }

    /**
     * Parse a remap from a stringified JSON object.
     *
     * @deprecated Use `Token.addRemapFromString` instead.
     */
    static parseRemapFromString(remap: string) {
        const data = JSON.parse(remap) as TokenMapping;
        Token.addRemap("default", data.tokens);
    }

    /** Parse a remap for the specified chain from a stringified JSON object */
    static addRemapFromString(chain: ChainId, remap: string) {
        const data = JSON.parse(remap) as TokenMapping;
        Token.addRemap(chain, data.tokens);
    }

    private static addRemap(chain: ChainId | "default", tokens: TokenMetadata[]) {
        Token.tokenMappings[chain] = {
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

        Token.tokenMappings[chain] = {
            tokens: lowercaseTokens,
        };

        if (!DEFAULT_CHAIN) {
            DEFAULT_CHAIN = chain;
        }
    }

    private _name: string;
    private _ticker: string;
    private _address: Address;
    private _decimals: number;
    private _supported_exchanges: Partial<Record<Exchange, string>>;
    private _chain_addresses: Record<string, string>;
    private _logo_url: string;
    private _chain?: ChainId;

    constructor(tokenMetadata: TokenMetadata, chain?: ChainId) {
        this._name = tokenMetadata.name;
        this._ticker = tokenMetadata.ticker;
        this._address = tokenMetadata.address;
        this._decimals = tokenMetadata.decimals;
        this._supported_exchanges = tokenMetadata.supported_exchanges;
        this._chain_addresses = tokenMetadata.chain_addresses;
        this._logo_url = tokenMetadata.logo_url;
        this._chain = chain;
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

    get chain(): ChainId | undefined {
        return this._chain;
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

    /**
     * Get a token from a ticker on a specific chain.
     *
     * @param ticker The ticker of the token to get.
     * @param chain The chain to get the token from.
     */
    static fromTickerOnChain(ticker: string, chain: ChainId): Token {
        const tokenData = Token.getTokenMapping(chain).tokens.find(
            (token) => token.ticker === ticker,
        );

        if (!tokenData) {
            return DEFAULT_TOKEN;
        }

        return new Token(tokenData, chain);
    }

    /**
     * Get a token from a ticker, using the default chain set.
     *
     * @param ticker The ticker of the token to get.
     */
    static fromTicker(ticker: string): Token {
        const tokenData = Token.getDefaultTokenMapping().tokens.find(
            (token) => token.ticker === ticker,
        );

        if (!tokenData) {
            return DEFAULT_TOKEN;
        }

        const chain = Token.resolveDefaultChainId();
        return new Token(tokenData, chain);
    }

    /** @deprecated Use `Token.fromTicker` instead */
    static findByTicker(ticker: string): Token {
        return Token.fromTicker(ticker);
    }

    /**
     * Get a token from an address on a specific chain.
     *
     * @param address The address of the token to get.
     * @param chain The chain to get the token from.
     */
    static fromAddressOnChain(address: Address, chain: ChainId): Token {
        const tokenData = Token.getTokenMapping(chain).tokens.find(
            (token) => token.address === address.toLowerCase(),
        );

        if (!tokenData) {
            return DEFAULT_TOKEN;
        }

        return new Token(tokenData, chain);
    }

    /**
     * Get a token from an address, using the default chain set.
     *
     * @param address The address of the token to get.
     */
    static fromAddress(address: Address): Token {
        const tokenData = Token.getDefaultTokenMapping().tokens.find(
            (token) => token.address === address.toLowerCase(),
        );

        if (!tokenData) {
            return DEFAULT_TOKEN;
        }

        const chain = Token.resolveDefaultChainId();
        return new Token(tokenData, chain);
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
        chain?: ChainId,
    ): Token {
        return new Token(
            {
                name,
                ticker,
                address,
                decimals,
                supported_exchanges,
                chain_addresses,
                logo_url,
            },
            chain,
        );
    }

    static getAllTokens(): Token[] {
        const chain = Token.resolveDefaultChainId();
        return Token.getAllTokensMetadata().map((token) => new Token(token, chain));
    }

    static getAllTokensOnChain(chain: ChainId): Token[] {
        const tokenMapping = Token.getTokenMapping(chain);

        return tokenMapping.tokens.map((token) => new Token(token, chain));
    }

    static resolveDefaultChainId(): ChainId | undefined {
        return DEFAULT_CHAIN === "default" ? undefined : DEFAULT_CHAIN;
    }

    private static getAllTokensMetadata(): TokenMetadata[] {
        return Object.values(Token.tokenMappings).flatMap((mapping) => mapping.tokens);
    }

    private static getDefaultTokenMapping(): TokenMapping {
        if (!DEFAULT_CHAIN) {
            throw new Error(
                "A default chain has not been set. Initialize the token mapping first.",
            );
        }

        return Token.getTokenMapping(DEFAULT_CHAIN);
    }

    private static getTokenMapping(chain: ChainId | "default"): TokenMapping {
        if (!Token.tokenMappings[chain]) {
            throw new Error(
                `${chain} token mapping not initialized. Initialize the token mapping first.`,
            );
        }

        return Token.tokenMappings[chain];
    }
}

const DEFAULT_TOKEN = Token.create(
    "UNKNOWN",
    "UNKNOWN",
    zeroAddress,
    0,
    undefined,
    undefined,
    undefined,
    Token.resolveDefaultChainId(),
);

/** @deprecated Use `Token.getDefaultQuoteTokenOnChain` instead */
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
                undefined,
                undefined,
                Token.resolveDefaultChainId(),
            );
        case "okx":
            return Token.fromTicker("USDT");
        case "renegade":
            return Token.fromTicker("USDC");
    }
}

export function getDefaultQuoteTokenOnChain(chain: ChainId, exchange: Exchange): Token {
    switch (exchange) {
        case "binance":
            return Token.fromTickerOnChain("USDT", chain);
        case "coinbase":
            return Token.fromTickerOnChain("USDC", chain);
        case "kraken":
            return Token.create(
                "USD Coin",
                "USDC",
                "0x0000000000000000000000000000000000000000",
                6,
                { kraken: "USD" },
                undefined,
                undefined,
                chain,
            );
        case "okx":
            return Token.fromTickerOnChain("USDT", chain);
        case "renegade":
            return Token.fromTickerOnChain("USDC", chain);
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
