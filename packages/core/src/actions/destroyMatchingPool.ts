import { ADMIN_MATCHING_POOL_DESTROY_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { postRelayerWithAdmin } from '../utils/http.js'

export type DestroyMatchingPoolParameters = {
  matchingPool: string
}

export async function destroyMatchingPool(
  config: Config,
  parameters: DestroyMatchingPoolParameters,
) {
  const { matchingPool } = parameters
  const { getRelayerBaseUrl } = config

  try {
    await postRelayerWithAdmin(
      config,
      getRelayerBaseUrl(ADMIN_MATCHING_POOL_DESTROY_ROUTE(matchingPool)),
    )
  } catch (error) {
    console.error(`Failed to destroy matching pool ${matchingPool}`, {
      error,
    })
    throw error
  }
}
