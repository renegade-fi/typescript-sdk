import { type Config } from "../createConfig.js";
export type CreateWalletParameters = {};
export type CreateWalletReturnType = Promise<{
    taskId: string;
    walletId: string;
}>;
export declare function createWallet(config: Config, parameters?: CreateWalletParameters): CreateWalletReturnType;
//# sourceMappingURL=createWallet.d.ts.map