import { type Hex } from "viem";
import { type Config } from "../createConfig.js";
export type LookupWalletParameters = {
    seed?: Hex;
};
export type LookupWalletReturnType = Promise<{
    taskId: string;
    walletId: string;
}>;
export declare function lookupWallet(config: Config, parameters?: LookupWalletParameters): LookupWalletReturnType;
export declare function lookupWalletOnChain(config: Config): Promise<boolean>;
//# sourceMappingURL=lookupWallet.d.ts.map