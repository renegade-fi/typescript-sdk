import axios from 'axios'
import invariant from 'tiny-invariant'
import { getSymmetricKey } from '../actions/getSymmetricKey.js'
import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
  SIG_EXPIRATION_BUFFER_MS,
} from '../constants.js'
import type { BaseConfig, Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'
import { parseBigJSON } from './bigJSON.js'

export async function postRelayerRaw(url: string, body: any, headers = {}) {
  try {
    const response = await axios.post(url, body, {
      headers,
      transformResponse: (data) => parseBigJSON(data),
    })
    // console.log(`POST ${url} with body: `, body, "response: ", response.data)
    // Process the response data as needed
    return response.data // Assuming the function should return the response data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', error.response.data)
        throw new BaseError(error.response.data)
      }
      if (error.request) {
        // The request was made but no response was received
        console.error('Request error: No response received')
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message)
      }
    } else {
      // Non-Axios error
      console.error('Error:', error)
    }
    throw error // Rethrow the error for further handling or logging
  }
}

export async function getRelayerRaw(url: string, headers = {}) {
  try {
    const response = await axios.get(url, {
      headers,
      transformResponse: (data) => {
        try {
          if (
            url.includes('/order-history') ||
            url.includes('/open-orders') ||
            url.includes('/metadata')
          ) {
            // We use ts-ignore here because TypeScript doesn't recognize the
            // `context` argument in the JSON.parse reviver
            // @ts-ignore
            return JSON.parse(data, (key, value, context) => {
              if (typeof value === 'number' && key !== 'price') {
                if (context?.source === undefined) {
                  console.warn(
                    `No JSON source for ${key}, converting parsed value to BigInt`,
                  )
                  return BigInt(value)
                }
                return BigInt(context.source)
              }
              return value
            })
          }

          if (url.includes('/price')) {
            return JSON.parse(data)
          }

          return parseBigJSON(data)
        } catch (_error) {
          return data
        }
      },
    })
    // console.log(`GET ${url} response: `, response.data)
    // Process the response data as needed
    return response.data // Assuming the function should return the response data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', error.response.data)
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error: No response received')
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message)
      }
    } else {
      // Non-Axios error
      console.error('Error:', error)
    }
    throw error // Rethrow the error for further handling or logging
  }
}

export async function postRelayerWithAuth(
  config: Config,
  url: string,
  body?: string,
) {
  const symmetricKey = getSymmetricKey(config)
  invariant(symmetricKey, 'Failed to derive symmetric key')

  const path = getPathFromUrl(url)
  const headers = {
    'Content-Type': 'application/json',
  }
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    body ?? '',
    symmetricKey,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return await postRelayerRaw(url, body, headersWithAuth)
}

export async function postRelayerWithAdmin(
  config: Config,
  url: string,
  body?: string,
) {
  const { adminKey } = config
  invariant(adminKey, 'Admin key is required')
  const symmetricKey = config.utils.b64_to_hex_hmac_key(adminKey)

  const path = getPathFromUrl(url)
  const headers = {
    'Content-Type': 'application/json',
  }
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    body ?? '',
    symmetricKey,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return await postRelayerRaw(url, body, headersWithAuth)
}

export async function getRelayerWithAuth(config: Config, url: string) {
  const symmetricKey = getSymmetricKey(config)
  invariant(symmetricKey, 'Failed to derive symmetric key')

  const path = getPathFromUrl(url)
  const headers = {
    'Content-Type': 'application/json',
  }
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    '', // Body
    symmetricKey,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return await getRelayerRaw(url, headersWithAuth)
}

export async function getRelayerWithAdmin(config: Config, url: string) {
  const { adminKey } = config
  invariant(adminKey, 'Admin key is required')
  const symmetricKey = config.utils.b64_to_hex_hmac_key(adminKey)

  const path = getPathFromUrl(url)
  const headers = {
    'Content-Type': 'application/json',
  }
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    '', // Body
    symmetricKey,
    SIG_EXPIRATION_BUFFER_MS,
  )

  return await getRelayerRaw(url, headersWithAuth)
}

export async function postWithSymmetricKey(
  config: BaseConfig,
  {
    body,
    headers = {},
    key,
    url,
  }: {
    body?: string
    headers?: Record<string, string>
    key: string
    url: string
  },
) {
  const path = getPathFromUrl(url)
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    body ?? '',
    key,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return await postRelayerRaw(url, body, headersWithAuth)
}

export async function getWithSymmetricKey(
  config: BaseConfig,
  {
    headers = {},
    key,
    url,
  }: {
    headers?: Record<string, string>
    key: string
    url: string
  },
) {
  const path = getPathFromUrl(url)
  const headersWithAuth = addExpiringAuthToHeaders(
    config,
    path,
    headers,
    '',
    key,
    SIG_EXPIRATION_BUFFER_MS,
  )
  return await getRelayerRaw(url, headersWithAuth)
}

/// Get the path from a URL
function getPathFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.pathname || '/'
  } catch {
    return url.startsWith('/') ? url : `/${url}`
  }
}

/// Add an auth expiration and signature to a set of headers
export function addExpiringAuthToHeaders(
  config: BaseConfig,
  path: string,
  headers: Record<string, string>,
  body: string,
  key: string,
  expiration: number,
): Record<string, string> {
  // Add a timestamp
  const expirationTs = Date.now() + expiration
  const headersWithExpiration = {
    ...headers,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expirationTs.toString(),
  }

  // Add the signature
  const auth = config.utils.create_request_signature(
    path,
    headersWithExpiration,
    body,
    key,
  )

  return { ...headersWithExpiration, [RENEGADE_AUTH_HEADER_NAME]: auth }
}
