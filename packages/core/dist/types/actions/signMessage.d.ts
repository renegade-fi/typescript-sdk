import type { Hex } from 'viem';
import type { Config } from '../createConfig.js';
export type SignMessageParameters = {
    message: string;
};
export type SignMessageReturnType = Hex;
export declare const signMessage: (config: Config, parameters: SignMessageParameters) => SignMessageReturnType;
//# sourceMappingURL=signMessage.d.ts.map