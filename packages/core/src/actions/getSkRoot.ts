import invariant from 'tiny-invariant'
import type { Hex } from 'viem'

import type { Config } from '../createConfig.js'

export type GetSkRootParameters = {
  seed?: Hex
}

export type GetSkRootReturnType = Hex

export function getSkRoot(
  config: Config,
  parameters: GetSkRootParameters = {},
): GetSkRootReturnType {
  const { seed } = parameters
  const { utils } = config
  if (seed) {
    config.setState({ ...config.state, seed })
    return utils.derive_signing_key_from_seed(seed)
  }
  const storedSeed = config.state.seed
  invariant(storedSeed, 'Seed must be defined when none exists in memory')
  return utils.derive_signing_key_from_seed(storedSeed)
}
