import type { Hex } from 'viem'
import { getSkRoot } from './getSkRoot.js'

import type { Config } from '../createConfig.js'

export type GetWalletIdParameters = { seed?: Hex }

export type GetWalletIdReturnType = string

export function getWalletId(
  config: Config,
  parameters: GetWalletIdParameters = {},
): GetWalletIdReturnType {
  const { utils } = config
  const { seed } = parameters
  const skRoot = getSkRoot(config, { seed })
  const walletId = utils.wallet_id(skRoot)
  return walletId
}
