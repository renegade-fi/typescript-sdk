import JSONBigInt from 'json-bigint'
import { toHex, type Address } from 'viem'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'
import { BaseError } from '../errors/base.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { WALLET_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { Token } from '../types/token.js'

export type CreateOrderParameters = {
  id?: string
  base: Address
  quote: Address
  side: 'buy' | 'sell'
  amount: bigint
}

export type CreateOrderReturnType = Promise<{ taskId: string }>

export async function createOrder(
  config: Config,
  parameters: CreateOrderParameters,
): CreateOrderReturnType {
  const { id = '', base, quote, side, amount } = parameters
  const { getRelayerBaseUrl, utils } = config

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  // Safety
  const filteredWallet = await getBackOfQueueWallet(config, {
    filterDefaults: true,
  })
  const balances = filteredWallet?.balances
  console.log('order error debug: ', {
    side,
    balances,
    base,
  })
  if (
    side === 'buy' &&
    balances?.length === 5 &&
    !balances.find((b) => b.mint === base)
  ) {
    throw new BaseError('Order would result in too many balances')
  }

  const body = utils.new_order(
    JSONBigInt.stringify(wallet),
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
    body: JSONBigInt.parse(body),
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
      `wallet id: ${walletId} creating order to ${side} ${amount} ${
        Token.findByAddress(base).ticker
      } failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
