import type { BYOKConfig } from '../../utils/createBYOKConfig.js'

export type GetPkRootParameters = {
  pkRoot: `0x${string}`
}

export type GetPkRootScalarsReturnType = bigint[]

export function getPkRootScalars(
  config: BYOKConfig,
  parameters: GetPkRootParameters,
): GetPkRootScalarsReturnType {
  const { utils } = config
  const { pkRoot } = parameters
  const scalars = utils.byok_get_pk_root_scalars(pkRoot)
  return scalars.map((s: string) => BigInt(s)).slice(0, 4)
}
