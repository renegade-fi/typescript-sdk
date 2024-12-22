import {
  CANCEL_ORDER_ROUTE,
  postWithSymmetricKey,
  stringifyForWasm,
} from '@renegade-fi/core'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'

export type CancelOrderParameters = {
  id: string
  newPublicKey?: `0x${string}`
}

export type CancelOrderReturnType = Promise<{ taskId: string }>

export async function cancelOrder(
  config: BYOKConfig,
  parameters: CancelOrderParameters,
): CancelOrderReturnType {
  const { id, newPublicKey } = parameters
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

  const body = await utils.byok_cancel_order(
    walletStr,
    signMessage,
    newPublicKey ?? publicKey,
    id,
  )

  try {
    const res = await postWithSymmetricKey(config, {
      body,
      key: symmetricKey,
      url: getRelayerBaseUrl(CANCEL_ORDER_ROUTE(walletId, id)),
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
