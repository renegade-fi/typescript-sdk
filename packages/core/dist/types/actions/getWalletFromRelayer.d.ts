import type { Hex } from "viem";
import { type Config } from "../createConfig.js";
import type { Wallet } from "../types/wallet.js";
export type GetWalletFromRelayerParameters = {
    seed?: Hex;
};
export type GetWalletFromRelayerReturnType = Promise<Wallet | void>;
export declare function getWalletFromRelayer(config: Config, parameters?: GetWalletFromRelayerParameters): GetWalletFromRelayerReturnType;
//# sourceMappingURL=getWalletFromRelayer.d.ts.map