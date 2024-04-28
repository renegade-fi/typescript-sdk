import { type Address } from "viem";
export declare class Token {
    private _name;
    private _ticker;
    private _address;
    private _decimals;
    constructor(name: string, ticker: string, address: Address, decimals: number);
    get name(): string;
    get ticker(): string;
    get address(): Address;
    get decimals(): number;
    static findByTicker(ticker: string): Token;
    static findByAddress(address: Address): Token;
    static create(name: string, ticker: string, address: Address, decimals: number): Token;
}
//# sourceMappingURL=token.d.ts.map