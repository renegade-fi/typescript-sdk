import invariant from 'tiny-invariant'
import { toHex } from 'viem'
import {
  RENEGADE_API_KEY_HEADER,
  REQUEST_EXTERNAL_MATCH_QUOTE_ROUTE,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalOrder,
  SignedExternalMatchQuote,
} from '../types/externalMatch.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type GetExternalMatchQuoteParameters = {
  order: ExternalOrder
  doGasEstimation?: boolean
}

export type GetExternalMatchQuoteReturnType = SignedExternalMatchQuote

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
    doGasEstimation = false,
  } = parameters
  const { apiSecret, apiKey } = config
  invariant(apiSecret, 'API secret not specified in config')
  invariant(apiKey, 'API key not specified in config')
  const symmetricKey = config.utils.b64_to_hex_hmac_key(apiSecret)

  const body = config.utils.new_external_order(
    base,
    quote,
    side,
    toHex(baseAmount),
    toHex(quoteAmount),
    toHex(minFillSize),
    doGasEstimation,
  )

  const res = await postWithSymmetricKey(config, {
    url: config.getBaseUrl(REQUEST_EXTERNAL_MATCH_QUOTE_ROUTE),
    body,
    key: symmetricKey,
    headers: {
      [RENEGADE_API_KEY_HEADER]: apiKey,
    },
  })
  if (!res.signed_quote) {
    throw new BaseError('No quote found')
  }

  return res.signed_quote
}
