import JSONBigInt from 'json-bigint'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { CANCEL_ORDER_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { getWalletFromRelayer } from './getWalletFromRelayer.js'

export type CancelOrderParameters = {
  id: string
}

export type CancelOrderReturnType = Promise<{ taskId: string }>

export async function cancelOrder(
  config: Config,
  parameters: CancelOrderParameters,
): CancelOrderReturnType {
  const { id } = parameters
  const { getRelayerBaseUrl, utils } = config

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)
  const _wallet = await getWalletFromRelayer(config)
  console.log('🚀 ~ wallet:', wallet)
  console.log('🚀 ~ _wallet:', _wallet)
  const body = utils.cancel_order(JSONBigInt.stringify(wallet), id)

  const logContext = {
    walletId,
    orderId: id,
    body: JSON.parse(body),
    wallet,
  }

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(CANCEL_ORDER_ROUTE(walletId, id)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`wallet id: ${walletId} canceling order ${id} failed`, {
      error,
      ...logContext,
    })
    throw error
  }
}
