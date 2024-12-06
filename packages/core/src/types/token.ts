import invariant from 'tiny-invariant'
import { type Address, isHex, zeroAddress } from 'viem'
import type { Exchange } from './wallet.js'

////////////////////////////////////////////////////////////////////////////////
// Token Mapping
////////////////////////////////////////////////////////////////////////////////

type TokenMetadata = {
  name: string
  ticker: string
  address: Address
  decimals: number
  supported_exchanges: Partial<Record<Exchange, string>>
  chain_addresses: Record<string, string>
  logo_url: string
}

type TokenMapping = {
  tokens: TokenMetadata[]
}

const tokenMappingUrl =
  process.env.TOKEN_MAPPING_URL || process.env.NEXT_PUBLIC_TOKEN_MAPPING_URL

const tokenMappingStr =
  process.env.NEXT_PUBLIC_TOKEN_MAPPING || process.env.TOKEN_MAPPING

invariant(
  tokenMappingUrl || tokenMappingStr,
  'No token mapping initialization option provided',
)

export const tokenMapping: TokenMapping = {
  tokens: [],
}

export async function loadTokenMapping() {
  if (!tokenMappingUrl) {
    throw new Error('No token mapping URL provided')
  }

  const res = await fetch(tokenMappingUrl)
  const data = await res.json()
  formatTokenMapping(data)

  tokenMapping.tokens = data.tokens
}

function formatTokenMapping(data: any) {
  for (const t of data.tokens) {
    t.supported_exchanges = Object.fromEntries(
      Object.entries(t.supported_exchanges).map(([k, v]) => [
        // Lowercase all of the exchange names to match the Exchange enum
        k.toLowerCase(),
        v,
      ]),
    )
  }
}

if (tokenMappingStr) {
  const envTokenMapping = JSON.parse(tokenMappingStr!)
  formatTokenMapping(envTokenMapping)
  tokenMapping.tokens = envTokenMapping.tokens
}

////////////////////////////////////////////////////////////////////////////////
// Token Class
////////////////////////////////////////////////////////////////////////////////

export const STABLECOINS = ['USDC', 'USDT']

export class Token {
  private _name: string
  private _ticker: string
  private _address: Address
  private _decimals: number
  private _supported_exchanges: Partial<Record<Exchange, string>>
  private _chain_addresses: Record<string, string>
  private _logo_url: string

  constructor(tokenMetadata: TokenMetadata) {
    this._name = tokenMetadata.name
    this._ticker = tokenMetadata.ticker
    this._address = tokenMetadata.address
    this._decimals = tokenMetadata.decimals
    this._supported_exchanges = tokenMetadata.supported_exchanges
    this._chain_addresses = tokenMetadata.chain_addresses
    this._logo_url = tokenMetadata.logo_url
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

  get supportedExchanges(): Set<Exchange> {
    return new Set(Object.keys(this._supported_exchanges)) as Set<Exchange>
  }

  get rawSupportedExchanges(): Partial<Record<Exchange, string>> {
    return this._supported_exchanges
  }

  get chainAddresses(): Record<string, string> {
    return this._chain_addresses
  }

  get logoUrl(): string {
    return this._logo_url
  }

  getExchangeTicker(exchange: Exchange): string | undefined {
    return this._supported_exchanges[exchange]
  }

  isStablecoin(): boolean {
    return STABLECOINS.includes(this.ticker)
  }

  static findByTicker(ticker: string): Token {
    if (tokenMapping.tokens.length === 0) {
      throw new Error('Token mapping not initialized')
    }

    const tokenData = tokenMapping.tokens.find(
      (token) => token.ticker === ticker,
    )
    if (tokenData) {
      return new Token(tokenData)
    }
    return DEFAULT_TOKEN
  }

  static findByAddress(address: Address): Token {
    if (tokenMapping.tokens.length === 0) {
      throw new Error('Token mapping not initialized')
    }

    const tokenData = tokenMapping.tokens.find(
      (token) => token.address.toLowerCase() === address.toLowerCase(),
    )
    if (tokenData) {
      return new Token(tokenData)
    }
    return DEFAULT_TOKEN
  }

  static create(
    name: string,
    ticker: string,
    address: Address,
    decimals: number,
    supported_exchanges: Partial<Record<Exchange, string>> = {},
    chain_addresses: Record<string, string> = {},
    logo_url = '',
  ): Token {
    if (!isHex(address)) {
      throw new Error('Invalid address')
    }
    return new Token({
      name,
      ticker,
      address,
      decimals,
      supported_exchanges,
      chain_addresses,
      logo_url,
    })
  }
}

const DEFAULT_TOKEN = Token.create('UNKNOWN', 'UNKNOWN', zeroAddress, 0)

export function getDefaultQuoteToken(exchange: Exchange): Token {
  switch (exchange) {
    case 'binance':
      return Token.findByTicker('USDT')
    case 'coinbase':
      return Token.findByTicker('USDC')
    case 'kraken':
      return Token.create(
        'USD Coin',
        'USDC',
        '0x0000000000000000000000000000000000000000',
        6,
        { kraken: 'USD' },
      )
    case 'okx':
      return Token.findByTicker('USDT')
  }
}
