import type { Config } from '../createConfig.js';
export type CreateWalletReturnType = Promise<{
    taskId: string;
    walletId: string;
}>;
export declare function createWallet(config: Config): CreateWalletReturnType;
//# sourceMappingURL=createWallet.d.ts.map