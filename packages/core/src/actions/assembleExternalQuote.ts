import invariant from 'tiny-invariant'
import {
  ASSEMBLE_EXTERNAL_MATCH_ROUTE,
  RENEGADE_API_KEY_HEADER,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalMatchBundle,
  ExternalOrder,
  SignedExternalMatchQuote,
} from '../types/externalMatch.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type AssembleExternalQuoteParameters = {
  quote: SignedExternalMatchQuote
  updatedOrder?: ExternalOrder
  doGasEstimation?: boolean
}

export type AssembleExternalQuoteReturnType = ExternalMatchBundle

export type AssembleExternalQuoteErrorType = BaseErrorType

export async function assembleExternalQuote(
  config: AuthConfig,
  parameters: AssembleExternalQuoteParameters,
): Promise<AssembleExternalQuoteReturnType> {
  const { quote, updatedOrder, doGasEstimation = false } = parameters
  const { apiSecret, apiKey } = config
  invariant(apiSecret, 'API secret not specified in config')
  invariant(apiKey, 'API key not specified in config')
  const symmetricKey = config.utils.b64_to_hex_hmac_key(apiSecret)

  const stringifiedQuote = stringifyForWasm(quote)
  const stringifiedOrder = updatedOrder ? stringifyForWasm(updatedOrder) : ''
  const body = config.utils.assemble_external_match(
    doGasEstimation,
    stringifiedOrder,
    stringifiedQuote,
  )

  const res = await postWithSymmetricKey(config, {
    url: config.getAuthServerUrl(ASSEMBLE_EXTERNAL_MATCH_ROUTE),
    body,
    key: symmetricKey,
    headers: {
      [RENEGADE_API_KEY_HEADER]: apiKey,
    },
  })
  if (!res.match_bundle) {
    throw new BaseError('Failed to assemble external quote')
  }
  return res.match_bundle
}
