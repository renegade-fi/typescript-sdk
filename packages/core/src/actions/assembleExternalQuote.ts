import invariant from 'tiny-invariant'
import { zeroAddress } from 'viem'
import {
  ASSEMBLE_EXTERNAL_MATCH_ROUTE,
  GAS_SPONSORSHIP_PARAM,
  REFUND_ADDRESS_PARAM,
  RENEGADE_API_KEY_HEADER,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalMatchResponse,
  ExternalOrder,
  SignedExternalMatchQuote,
} from '../types/externalMatch.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type AssembleExternalQuoteParameters = {
  quote: SignedExternalMatchQuote
  updatedOrder?: ExternalOrder
  doGasEstimation?: boolean
  requestGasSponsorship?: boolean
  refundAddress?: `0x${string}`
}

export type AssembleExternalQuoteReturnType = ExternalMatchResponse

export type AssembleExternalQuoteErrorType = BaseErrorType

export async function assembleExternalQuote(
  config: AuthConfig,
  parameters: AssembleExternalQuoteParameters,
): Promise<AssembleExternalQuoteReturnType> {
  const {
    quote,
    updatedOrder,
    doGasEstimation = false,
    requestGasSponsorship = false,
    refundAddress = zeroAddress,
  } = parameters
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

  let url = config.getBaseUrl(ASSEMBLE_EXTERNAL_MATCH_ROUTE)
  if (requestGasSponsorship) {
    const searchParams = new URLSearchParams({
      [GAS_SPONSORSHIP_PARAM]: 'true',
      [REFUND_ADDRESS_PARAM]: refundAddress,
    })
    url += `?${searchParams.toString()}`
  }

  const res = await postWithSymmetricKey(config, {
    url,
    body,
    key: symmetricKey,
    headers: {
      [RENEGADE_API_KEY_HEADER]: apiKey,
    },
  })
  if (!res.match_bundle) {
    throw new BaseError('Failed to assemble external quote')
  }
  return res
}
