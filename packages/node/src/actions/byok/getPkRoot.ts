import type { Config } from '@renegade-fi/core'

export type GetPkRootParameters = {
  pkRoot: `0x${string}`
}

export type GetPkRootScalarsReturnType = bigint[]

export function getPkRootScalars(
  config: Config,
  parameters: GetPkRootParameters,
): GetPkRootScalarsReturnType {
  const { utils } = config
  const { pkRoot } = parameters
  const scalars = utils.byok_get_pk_root_scalars(pkRoot)
  return scalars.map((s: string) => BigInt(s)).slice(0, 4)
}