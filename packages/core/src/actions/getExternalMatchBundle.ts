import invariant from 'tiny-invariant'
import { toHex } from 'viem'
import {
  RENEGADE_API_KEY_HEADER,
  REQUEST_EXTERNAL_MATCH_ROUTE,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalMatchBundle,
  ExternalOrder,
} from '../types/externalMatch.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type GetExternalMatchBundleParameters = {
  order: ExternalOrder
  doGasEstimation?: boolean
}

export type GetExternalMatchBundleReturnType = ExternalMatchBundle

export type GetExternalMatchBundleErrorType = BaseErrorType

export async function getExternalMatchBundle(
  config: AuthConfig,
  parameters: GetExternalMatchBundleParameters,
): Promise<GetExternalMatchBundleReturnType> {
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
    url: config.getBaseUrl(REQUEST_EXTERNAL_MATCH_ROUTE),
    body,
    key: symmetricKey,
    headers: {
      [RENEGADE_API_KEY_HEADER]: apiKey,
    },
  })
  if (!res.match_bundle) {
    throw new BaseError('No match bundle found')
  }
  return res.match_bundle
}
