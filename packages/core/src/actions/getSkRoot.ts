import invariant from 'tiny-invariant'
import type { Hex } from 'viem'
import type { Config } from '../createConfig.js'

export type GetSkRootReturnType = Hex

export function getSkRoot(config: Config): GetSkRootReturnType {
  const { utils } = config
  const storedSeed = config.state.seed
  invariant(storedSeed, 'Seed must be defined when none exists in memory')
  return utils.derive_signing_key_from_seed(storedSeed)
}
