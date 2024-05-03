import type { Hex } from 'viem'
import { getSkRoot } from './getSkRoot.js'

import { getRelayerWithAuth } from '../utils/http.js'

import { BACK_OF_QUEUE_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { Wallet } from '../types/wallet.js'

export type GetBackOfQueueWalletParameters = { seed?: Hex }

export type GetBackOfQueueWalletReturnType = Promise<Wallet | undefined>

export async function getBackOfQueueWallet(
  config: Config,
  parameters: GetBackOfQueueWalletParameters = {},
): GetBackOfQueueWalletReturnType {
  const { seed } = parameters
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config, { seed })
  const walletId = utils.wallet_id(skRoot)
  const res = await getRelayerWithAuth(
    config,
    getRelayerBaseUrl(BACK_OF_QUEUE_WALLET_ROUTE(walletId)),
  )
  return res.wallet
}
