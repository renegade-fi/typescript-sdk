import { REFRESH_WALLET_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getWalletId } from './getWalletId.js'

export type RefreshWalletReturnType = {
  taskId: string
}

export async function refreshWallet(
  config: RenegadeConfig,
): Promise<RefreshWalletReturnType> {
  const { getBaseUrl } = config
  const walletId = getWalletId(config)

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(REFRESH_WALLET_ROUTE(walletId)),
    )
    if (res?.task_id) {
      console.log(`task refresh-wallet(${res.task_id}): ${walletId}`)
    }
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
