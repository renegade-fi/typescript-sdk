import invariant from "tiny-invariant";
import type { Hex } from "viem";
import type { Config } from "../createConfig.js";

export type GetSymmetricKeyReturnType = Hex;
export function getSymmetricKey(config: Config): GetSymmetricKeyReturnType {
    const {
        utils,
        state: { seed },
    } = config;
    invariant(seed, "Seed is required");
    return utils.get_symmetric_key(seed) as Hex;
}
