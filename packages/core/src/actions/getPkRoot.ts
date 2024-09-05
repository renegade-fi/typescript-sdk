import invariant from 'tiny-invariant'
import type { Hex } from 'viem'
import type { Config } from '../createConfig.js'

export type GetPkRootParameters = {
  nonce: bigint
}

export type GetPkRootReturnType = Hex
export type GetPkRootScalarsReturnType = bigint[]
export function getPkRoot(
  config: Config,
  parameters: GetPkRootParameters = { nonce: BigInt(0) },
): GetPkRootReturnType {
  const {
    utils,
    state: { seed },
  } = config
  const { nonce } = parameters
  invariant(seed, 'Seed is required')
  return `0x${utils.get_pk_root(seed, nonce)}`
}

export function getPkRootScalars(
  config: Config,
  parameters: GetPkRootParameters = { nonce: BigInt(0) },
): GetPkRootScalarsReturnType {
  const {
    utils,
    state: { seed },
  } = config
  const { nonce } = parameters
  invariant(seed, 'Seed is required')
  const scalars = utils.get_pk_root_scalars(seed, nonce)
  return scalars.map((s: string) => BigInt(s)).slice(0, 4)
}
