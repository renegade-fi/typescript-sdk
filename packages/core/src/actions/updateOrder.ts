import { toHex, type Address } from 'viem'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { UPDATE_ORDER_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { Token } from '../types/token.js'
import { parseBigJSON, stringifyForWasm } from '../utils/bigJSON.js'
import invariant from 'tiny-invariant'

export type UpdateOrderParameters = {
  id?: string
  base: Address
  quote: Address
  side: 'buy' | 'sell'
  amount: bigint
}

export type UpdateOrderReturnType = Promise<{ taskId: string }>

export async function updateOrder(
  config: Config,
  parameters: UpdateOrderParameters,
): UpdateOrderReturnType {
  const { id = '', base, quote, side, amount } = parameters
  const { getRelayerBaseUrl, utils, state: { seed } } = config
  invariant(seed, 'Seed is required')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const body = utils.update_order(
    seed,
    stringifyForWasm(wallet),
    id,
    base,
    quote,
    side,
    toHex(amount),
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
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(UPDATE_ORDER_ROUTE(walletId, id)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(
      `wallet id: ${walletId} updating order ${id} to ${side} ${amount} ${Token.findByAddress(base).ticker
      } failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
