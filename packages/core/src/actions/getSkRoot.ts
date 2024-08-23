import invariant from 'tiny-invariant'
import type { Hex } from 'viem'
import type { Config } from '../createConfig.js'

export type GetSkRootParameters = {
  nonce: bigint
}

export type GetSkRootReturnType = Hex

export function getSkRoot(config: Config, parameters: GetSkRootParameters = { nonce: BigInt(0) }): GetSkRootReturnType {
  const { utils } = config
  const { nonce } = parameters
  const storedSeed = config.state.seed
  invariant(storedSeed, 'Seed must be defined when none exists in memory')
  return utils.derive_sk_root_from_seed(storedSeed, nonce)
}
