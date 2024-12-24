import invariant from 'tiny-invariant'
import { type Address, type Hex, toHex } from 'viem'
import { WALLET_ORDERS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type CreateOrderParameters = {
  id?: string
  base: Address
  quote: Address
  side: 'buy' | 'sell'
  amount: bigint
  worstCasePrice?: string
  minFillSize?: bigint
  allowExternalMatches?: boolean
  newPublicKey?: Hex
}

export type CreateOrderReturnType = { taskId: string }

export type CreateOrderErrorType = BaseErrorType

export async function createOrder(
  config: Config,
  parameters: CreateOrderParameters,
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
    newPublicKey,
  } = parameters
  const {
    getBaseUrl,
    utils,
    state: { seed },
    renegadeKeyType,
  } = config
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
    worstCasePrice,
    toHex(minFillSize),
    allowExternalMatches,
    renegadeKeyType,
    newPublicKey,
  )

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
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
