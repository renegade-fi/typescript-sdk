import invariant from 'tiny-invariant'
import type { Hex } from 'viem'
import type { Config, RenegadeConfig } from '../createConfig.js'

export type GetPkRootParameters = {
  nonce?: bigint
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
  invariant(nonce, 'Nonce is required')
  return `0x${utils.get_pk_root(seed, nonce)}`
}

export function getPkRootScalars(
  config: RenegadeConfig,
  parameters: GetPkRootParameters = {},
): GetPkRootScalarsReturnType {
  const { utils, renegadeKeyType } = config
  const { nonce } = parameters

  const seed = renegadeKeyType === 'internal' ? config.state.seed : undefined
  const publicKey =
    renegadeKeyType === 'external' ? config.publicKey : undefined

  if (renegadeKeyType === 'internal') {
    invariant(seed !== undefined, 'Seed is required for internal key type')
    invariant(nonce !== undefined, 'Nonce is required for internal key type')
  }

  const scalars = utils.get_pk_root_scalars(seed, nonce, publicKey)
  return scalars.map((s: string) => BigInt(s)).slice(0, 4)
}
