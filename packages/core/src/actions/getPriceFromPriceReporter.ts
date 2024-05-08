import type { Address } from 'viem'
import { PRICE_REPORTER_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { Token } from '../types/token.js'
import type { Exchange } from '../types/wallet.js'
import { getRelayerRaw } from '../utils/http.js'

export const DEFAULT_QUOTE: Record<Exchange, Address> = {
  binance: Token.findByTicker('USDT').address,
  coinbase: Token.findByTicker('USDC').address,
  kraken: '0x0000000000000000000000000000000000000000' as Address,
  okx: Token.findByTicker('USDT').address,
}

export type GetPriceParameters = {
  exchange?: Exchange
  base: Address
  quote?: Address
}

export type GetPriceReturnType = Promise<number>

export async function getPriceFromPriceReporter(
  config: Config,
  parameters: GetPriceParameters,
): GetPriceReturnType {
  const {
    exchange = 'binance',
    base,
    quote = DEFAULT_QUOTE[exchange],
  } = parameters
  const { getPriceReporterHTTPBaseUrl } = config

  const res = await getRelayerRaw(
    getPriceReporterHTTPBaseUrl(PRICE_REPORTER_ROUTE(exchange, base, quote)),
  )
  return res
}
