import { type Config } from "../createConfig.js";
import type { Balance } from "../types/wallet.js";
export type GetBalancesParameters = {};
export type GetBalancesReturnType = Promise<Balance[]>;
export declare function getBalances(config: Config, parameters?: GetBalancesParameters): GetBalancesReturnType;
//# sourceMappingURL=getBalances.d.ts.map