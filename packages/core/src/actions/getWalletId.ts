import invariant from 'tiny-invariant'
import type { Config } from '../createConfig.js'

export type GetWalletIdReturnType = string

export function getWalletId(config: Config): GetWalletIdReturnType {
  const { utils, state: { seed } } = config
  invariant(seed, 'seed is required')
  const walletId = utils.wallet_id(seed)
  return walletId
}
