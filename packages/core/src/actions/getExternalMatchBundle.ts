import invariant from 'tiny-invariant'
import { toHex, zeroAddress } from 'viem'
import {
  GAS_SPONSORSHIP_PARAM,
  REFUND_ADDRESS_PARAM,
  RENEGADE_API_KEY_HEADER,
  REQUEST_EXTERNAL_MATCH_ROUTE,
} from '../constants.js'
import type { AuthConfig } from '../createAuthConfig.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import type {
  ExternalMatchResponse,
  ExternalOrder,
} from '../types/externalMatch.js'
import { postWithSymmetricKey } from '../utils/http.js'

export type GetExternalMatchBundleParameters = {
  order: ExternalOrder
  doGasEstimation?: boolean
  useGasSponsorship?: boolean
  refundAddress?: `0x${string}`
}

export type GetExternalMatchBundleReturnType = ExternalMatchResponse

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
    useGasSponsorship = false,
    refundAddress = zeroAddress,
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

  let url = config.getBaseUrl(REQUEST_EXTERNAL_MATCH_ROUTE)
  if (useGasSponsorship) {
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
    throw new BaseError('No match bundle found')
  }
  return res
}
