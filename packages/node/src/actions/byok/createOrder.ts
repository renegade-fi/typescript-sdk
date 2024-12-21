import {
  WALLET_ORDERS_ROUTE,
  postWithSymmetricKey,
  stringifyForWasm,
} from '@renegade-fi/core'
import { type Address, type BaseErrorType, toHex } from 'viem'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'

export type CreateOrderParameters = {
  id?: string
  base: Address
  quote: Address
  side: 'buy' | 'sell'
  amount: bigint
  worstCasePrice?: string
  minFillSize?: bigint
  allowExternalMatches?: boolean
  newPublicKey?: `0x${string}`
}

export type CreateOrderReturnType = Promise<{ taskId: string }>

export type CreateOrderErrorType = BaseErrorType

export async function createOrder(
  config: BYOKConfig,
  parameters: CreateOrderParameters,
): CreateOrderReturnType {
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
    signMessage,
    symmetricKey,
    walletId,
    publicKey,
    getRelayerBaseUrl,
    utils,
  } = config

  const wallet = await getBackOfQueueWallet(config, {
    symmetricKey,
    walletId,
  })
  const walletStr = stringifyForWasm(wallet)

  const body = await utils.byok_create_order(
    walletStr,
    signMessage,
    newPublicKey ?? publicKey,
    id,
    base,
    quote,
    side,
    toHex(amount),
    worstCasePrice,
    toHex(minFillSize),
    allowExternalMatches,
  )

  try {
    const res = await postWithSymmetricKey(config, {
      body,
      key: symmetricKey,
      url: getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
    })
    console.log(`task update-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
