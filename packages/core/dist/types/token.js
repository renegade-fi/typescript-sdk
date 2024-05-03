import { isHex } from 'viem';
import { tokenMapping } from '../constants.js';
export class Token {
    constructor(name, ticker, address, decimals) {
        Object.defineProperty(this, "_name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_ticker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_decimals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._name = name;
        this._ticker = ticker;
        this._address = address;
        this._decimals = decimals;
    }
    get name() {
        return this._name;
    }
    get ticker() {
        return this._ticker;
    }
    get address() {
        return this._address;
    }
    get decimals() {
        return this._decimals;
    }
    static findByTicker(ticker) {
        const tokenData = tokenMapping.tokens.find((token) => token.ticker === ticker);
        if (tokenData) {
            return new Token(tokenData.name, tokenData.ticker, tokenData.address, tokenData.decimals);
        }
        throw new Error(`Token not found for ${ticker}`);
    }
    static findByAddress(address) {
        const tokenData = tokenMapping.tokens.find((token) => token.address === address);
        if (tokenData) {
            return new Token(tokenData.name, tokenData.ticker, tokenData.address, tokenData.decimals);
        }
        throw new Error(`Token not found for ${address}`);
    }
    static create(name, ticker, address, decimals) {
        if (!isHex(address)) {
            throw new Error('Invalid address');
        }
        return new Token(name, ticker, address, decimals);
    }
}
//# sourceMappingURL=token.js.map