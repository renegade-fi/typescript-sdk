import { type Address, isHex, zeroAddress } from 'viem'
import { tokenMapping } from '../constants.js'

export class Token {
  private _name: string
  private _ticker: string
  private _address: Address
  private _decimals: number

  constructor(
    name: string,
    ticker: string,
    address: Address,
    decimals: number,
  ) {
    this._name = name
    this._ticker = ticker
    this._address = address
    this._decimals = decimals
  }

  get name(): string {
    return this._name
  }

  get ticker(): string {
    return this._ticker
  }

  get address(): Address {
    return this._address
  }

  get decimals(): number {
    return this._decimals
  }

  static findByTicker(ticker: string): Token {
    const tokenData = tokenMapping.tokens.find(
      (token) => token.ticker === ticker,
    )
    if (tokenData) {
      return new Token(
        tokenData.name,
        tokenData.ticker,
        tokenData.address as Address,
        tokenData.decimals,
      )
    }
    return DEFAULT_TOKEN
  }

  static findByAddress(address: Address): Token {
    const tokenData = tokenMapping.tokens.find(
      (token) => token.address.toLowerCase() === address.toLowerCase(),
    )
    if (tokenData) {
      return new Token(
        tokenData.name,
        tokenData.ticker,
        tokenData.address as Address,
        tokenData.decimals,
      )
    }
    return DEFAULT_TOKEN
  }

  static create(
    name: string,
    ticker: string,
    address: Address,
    decimals: number,
  ): Token {
    if (!isHex(address)) {
      throw new Error('Invalid address')
    }
    return new Token(name, ticker, address, decimals)
  }
}

const DEFAULT_TOKEN = new Token('UNKNOWN', 'UNKNOWN', zeroAddress, 0)
