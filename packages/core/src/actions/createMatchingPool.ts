import { ADMIN_MATCHING_POOL_CREATE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { postRelayerWithAdmin } from '../utils/http.js'

export type CreateMatchingPoolParameters = {
  matchingPool: string
}

export async function createMatchingPool(
  config: Config,
  parameters: CreateMatchingPoolParameters,
) {
  const { matchingPool } = parameters
  const { getRelayerBaseUrl } = config

  try {
    await postRelayerWithAdmin(
      config,
      getRelayerBaseUrl(ADMIN_MATCHING_POOL_CREATE_ROUTE(matchingPool)),
    )
  } catch (error) {
    console.error(`Failed to create matching pool ${matchingPool}`, {
      error,
    })
    throw error
  }
}
