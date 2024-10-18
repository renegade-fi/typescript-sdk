import invariant from 'tiny-invariant'
import { toHex } from 'viem'
import { ADMIN_CREATE_ORDER_IN_MATCHING_POOL_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAdmin } from '../utils/http.js'
import type {
  CreateOrderParameters,
  CreateOrderReturnType,
} from './createOrder.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type CreateOrderInMatchingPoolParameters = {
  matchingPool: string
} & CreateOrderParameters

export async function createOrderInMatchingPool(
  config: Config,
  parameters: CreateOrderInMatchingPoolParameters,
): Promise<CreateOrderReturnType> {
  const {
    id = '',
    base,
    quote,
    side,
    amount,
    worstCasePrice = '',
    minFillSize = BigInt(0),
    allowExternalMatches = false,
    matchingPool,
  } = parameters
  const {
    getRelayerBaseUrl,
    utils,
    state: { seed },
  } = config
  invariant(seed, 'Seed is required')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const body = utils.new_order_in_matching_pool(
    seed,
    stringifyForWasm(wallet),
    id,
    base,
    quote,
    side,
    toHex(amount),
    worstCasePrice,
    toHex(minFillSize),
    allowExternalMatches,
    matchingPool,
  )

  try {
    const res = await postRelayerWithAdmin(
      config,
      getRelayerBaseUrl(ADMIN_CREATE_ORDER_IN_MATCHING_POOL_ROUTE(walletId)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
