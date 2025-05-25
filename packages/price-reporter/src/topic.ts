import { getDefaultQuoteToken } from "@renegade-fi/token";
import { RENEGADE_EXCHANGE } from "./constants.js";
import type { Exchange } from "@renegade-fi/core";

type Address = `0x${string}`;

interface PriceTopicParams {
    exchange: Exchange;
    base: Address;
    quote: Address;
}

type PriceTopicCreateParams = Partial<PriceTopicParams> & Pick<PriceTopicParams, 'base'>;

export class PriceTopic {
    readonly exchange: string;
    readonly base: Address;
    readonly quote: Address;

    constructor({ exchange, base, quote }: PriceTopicParams) {
        this.exchange = exchange;
        this.base = base;
        this.quote = quote;
    }

    /**
     * Create a new price topic
     */
    static new({ 
        exchange = RENEGADE_EXCHANGE, 
        base, 
        quote = getDefaultQuoteToken(exchange).address 
    }: PriceTopicCreateParams): PriceTopic {
        return new PriceTopic({ 
            exchange, 
            base, 
            quote 
        });
    }

    /**
     * Get the string representation of the price topic
     */
    toString(): string {
        if (this.exchange === RENEGADE_EXCHANGE) {
            return `${this.base}-${this.quote}`.toLowerCase();
        }
        return `${this.exchange}-${this.base}-${this.quote}`.toLowerCase();
    }

    /**
     * Create a WebSocket message for (un)subscribing to a topic
     */
    createMessage(method: 'subscribe' | 'unsubscribe') {
        return {
            method,
            topic: this.toString(),
        } as const;
    }
}