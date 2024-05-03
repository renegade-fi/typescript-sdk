import type { Hex } from 'viem';
import type { Config } from '../createConfig.js';
export type GetSkRootParameters = {
    seed?: Hex;
};
export type GetSkRootReturnType = Hex;
export declare function getSkRoot(config: Config, parameters?: GetSkRootParameters): GetSkRootReturnType;
//# sourceMappingURL=getSkRoot.d.ts.map