import invariant from 'tiny-invariant'
import { toHex, zeroAddress } from 'viem'
import {
  DISABLE_GAS_SPONSORSHIP_PARAM,
  REFUND_ADDRESS_PARAM,
  REFUND_NATIVE_ETH_PARAM,
  RENEGADE_API_KEY_HEADER,
  REQUEST_EXTERNAL_MATCH_QUOTE_ROUTE,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalOrder,
  SponsoredQuoteResponse,
} from '../types/externalMatch.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type GetExternalMatchQuoteParameters = {
  order: ExternalOrder
  doGasEstimation?: boolean
  disableGasSponsorship?: boolean
  refundAddress?: `0x${string}`
  refundNativeEth?: boolean
}

export type GetExternalMatchQuoteReturnType = SponsoredQuoteResponse

export type GetExternalMatchQuoteErrorType = BaseErrorType

export async function getExternalMatchQuote(
  config: AuthConfig,
  parameters: GetExternalMatchQuoteParameters,
): Promise<GetExternalMatchQuoteReturnType> {
  const {
    order: {
      base,
      quote,
      side,
      baseAmount = BigInt(0),
      quoteAmount = BigInt(0),
      minFillSize = BigInt(0),
    },
    doGasEstimation,
    disableGasSponsorship = false,
    refundAddress = zeroAddress,
    refundNativeEth = false,
  } = parameters

  if (doGasEstimation !== undefined) {
    console.warn('`doGasEstimation` is deprecated.')
  }

  const { apiSecret, apiKey } = config
  invariant(apiSecret, 'API secret not specified in config')
  invariant(apiKey, 'API key not specified in config')
  const symmetricKey = config.utils.b64_to_hex_hmac_key(apiSecret)

  const body = config.utils.new_external_quote_request(
    base,
    quote,
    side,
    toHex(baseAmount),
    toHex(quoteAmount),
    toHex(minFillSize),
  )

  let url = config.getBaseUrl(REQUEST_EXTERNAL_MATCH_QUOTE_ROUTE)
  const searchParams = new URLSearchParams({
    [DISABLE_GAS_SPONSORSHIP_PARAM]: disableGasSponsorship.toString(),
    [REFUND_ADDRESS_PARAM]: refundAddress,
    [REFUND_NATIVE_ETH_PARAM]: refundNativeEth.toString(),
  })
  url += `?${searchParams.toString()}`

  const res = await postWithSymmetricKey(config, {
    url,
    body,
    key: symmetricKey,
    headers: {
      [RENEGADE_API_KEY_HEADER]: apiKey,
    },
  })
  if (!res.signed_quote) {
    throw new BaseError('No quote found')
  }

  return {
    ...res.signed_quote,
    gas_sponsorship_info: res.gas_sponsorship_info ?? null,
  }
}
