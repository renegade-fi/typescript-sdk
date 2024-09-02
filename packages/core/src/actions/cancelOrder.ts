import invariant from 'tiny-invariant'
import { CANCEL_ORDER_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type CancelOrderParameters = {
  id: string
}

export type CancelOrderReturnType = { taskId: string }

export type CancelOrderErrorType = BaseErrorType

export async function cancelOrder(
  config: Config,
  parameters: CancelOrderParameters,
): Promise<CancelOrderReturnType> {
  const { id } = parameters
  const { getRelayerBaseUrl, utils, state: { seed } } = config
  invariant(seed, 'Seed is required')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const body = utils.cancel_order(seed, stringifyForWasm(wallet), id)

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(CANCEL_ORDER_ROUTE(walletId, id)),
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
