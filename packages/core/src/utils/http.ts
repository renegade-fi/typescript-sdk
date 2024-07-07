import axios from 'axios'

import { getSkRoot } from '../actions/getSkRoot.js'
import { BaseError } from '../errors/base.js'

import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_AUTH_HMAC_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
} from '../constants.js'
import type { Config } from '../createConfig.js'
import { parseBigJSON } from './bigJSON.js'
import invariant from 'tiny-invariant'

export async function postRelayerRaw(url: string, body: any, headers = {}) {
  try {
    const response = await axios.post(url, body, { headers })
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
          if (url.includes('/order-history') || url.includes('/open-orders')) {
            return JSON.parse(data, (key, value) => {
              if (typeof value === 'number' && key !== 'price') {
                return BigInt(value)
              }
              return value
            })
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
  const skRoot = await getSkRoot(config)
  const [auth, expiration] = config.utils.build_auth_headers(
    skRoot,
    body ?? '',
    BigInt(Date.now()),
  )
  const headers = {
    [RENEGADE_AUTH_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    'Content-Type': 'application/json',
  }
  return await postRelayerRaw(url, body, headers)
}

export async function postRelayerWithAdmin(
  config: Config,
  url: string,
  body?: string,
) {
  const { adminKey } = config
  invariant(adminKey, 'Admin key is required')

  const [auth, expiration] = config.utils.build_admin_headers(
    adminKey,
    body ?? '',
    BigInt(Date.now()),
  )

  const headers = {
    [RENEGADE_AUTH_HMAC_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    'Content-Type': 'application/json',
  }

  return await postRelayerRaw(url, body, headers)
}

export async function getRelayerWithAuth(config: Config, url: string) {
  const skRoot = await getSkRoot(config)
  const [auth, expiration] = config.utils.build_auth_headers(
    skRoot,
    '',
    BigInt(Date.now()),
  )
  const headers = {
    [RENEGADE_AUTH_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    'Content-Type': 'application/json',
  }
  return await getRelayerRaw(url, headers)
}

export async function getRelayerWithAdmin(config: Config, url: string) {
  const { adminKey } = config
  invariant(adminKey, 'Admin key is required')

  const [auth, expiration] = config.utils.build_admin_headers(
    adminKey,
    '',
    BigInt(Date.now()),
  )

  const headers = {
    [RENEGADE_AUTH_HMAC_HEADER_NAME]: auth,
    [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    'Content-Type': 'application/json',
  }

  return await getRelayerRaw(url, headers)
}
