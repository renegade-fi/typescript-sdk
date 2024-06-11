import type { Config } from '../createConfig.js'
import { getSkRoot } from './getSkRoot.js'

export type GetWalletIdReturnType = string

export function getWalletId(config: Config): GetWalletIdReturnType {
  const { utils } = config
  const skRoot = getSkRoot(config)
  const walletId = utils.wallet_id(skRoot)
  return walletId
}
