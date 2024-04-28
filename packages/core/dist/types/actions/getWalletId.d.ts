import type { Hex } from "viem";
import { type Config } from "../createConfig.js";
export type GetWalletIdParameters = {
    seed?: Hex;
};
export type GetWalletIdReturnType = string;
export declare function getWalletId(config: Config, parameters?: GetWalletIdParameters): GetWalletIdReturnType;
//# sourceMappingURL=getWalletId.d.ts.map