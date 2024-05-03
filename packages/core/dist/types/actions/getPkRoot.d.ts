import type { Hex } from 'viem';
import type { Config } from '../createConfig.js';
export type GetPkRootReturnType = Hex;
export type GetPkRootScalarsReturnType = bigint[];
export declare function getPkRoot(config: Config): GetPkRootReturnType;
export declare function getPkRootScalars(config: Config): GetPkRootScalarsReturnType;
//# sourceMappingURL=getPkRoot.d.ts.map