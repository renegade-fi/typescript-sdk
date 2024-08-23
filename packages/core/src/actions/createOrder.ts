import { toHex, type Address } from 'viem'
import { WALLET_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { Token } from '../types/token.js'
import { parseBigJSON, stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'
import invariant from 'tiny-invariant'

export type CreateOrderParameters = {
  id?: string
  base: Address
  quote: Address
  side: 'buy' | 'sell'
  amount: bigint
}

export type CreateOrderReturnType = { taskId: string }

export type CreateOrderErrorType = BaseErrorType

export async function createOrder(
  config: Config,
  parameters: CreateOrderParameters,
): Promise<CreateOrderReturnType> {
  const { id = '', base, quote, side, amount } = parameters
  const { getRelayerBaseUrl, utils, state: { seed } } = config
  invariant(seed, 'Seed is required')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const body = utils.new_order(
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
      getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(
      `wallet id: ${walletId} creating order to ${side} ${amount} ${Token.findByAddress(base).ticker
      } failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
