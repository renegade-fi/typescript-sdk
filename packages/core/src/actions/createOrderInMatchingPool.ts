import { toHex } from 'viem'
import { ADMIN_CREATE_ORDER_IN_MATCHING_POOL_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { parseBigJSON, stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAdmin } from '../utils/http.js'
import type {
  CreateOrderParameters,
  CreateOrderReturnType,
} from './createOrder.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'
import { Token } from '../types/token.js'

export type CreateOrderInMatchingPoolParameters = {
  matchingPool: string
} & CreateOrderParameters

export async function createOrderInMatchingPool(
  config: Config,
  parameters: CreateOrderInMatchingPoolParameters,
): CreateOrderReturnType {
  const { id = '', base, quote, side, amount, matchingPool } = parameters
  const { getRelayerBaseUrl, utils } = config

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const body = utils.new_order_in_matching_pool(
    stringifyForWasm(wallet),
    id,
    base,
    quote,
    side,
    toHex(amount),
    matchingPool,
  )

  const logContext = {
    walletId,
    base,
    quote,
    side,
    amount,
    body: parseBigJSON(body),
    wallet,
  }

  try {
    const res = await postRelayerWithAdmin(
      config,
      getRelayerBaseUrl(ADMIN_CREATE_ORDER_IN_MATCHING_POOL_ROUTE(walletId)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(
      `wallet id: ${walletId} creating order to ${side} ${amount} ${
        Token.findByAddress(base).ticker
      } in matching pool ${matchingPool} failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
