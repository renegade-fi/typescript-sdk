import { getSkRoot } from "./getSkRoot.js"
import { type Hex } from "viem"

import type { Config } from "../createConfig.js"

export type GetPkRootReturnType = Hex
export type GetPkRootScalarsReturnType = bigint[]
export function getPkRoot(config: Config): GetPkRootReturnType {
    const { utils } = config
    const skRoot = getSkRoot(config)
    return `0x${utils.get_pk_root(skRoot)}`
}

export function getPkRootScalars(config: Config): GetPkRootScalarsReturnType {
    const { utils } = config
    const skRoot = getSkRoot(config)
    const scalars = utils.pk_root_scalars(skRoot)
    return scalars.map((s: string) => BigInt(s)).slice(0, 4)
}
