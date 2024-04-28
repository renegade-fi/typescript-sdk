import type { Balance, Config } from "@renegade-fi/core";
export type UseBalancesParameters = {
    config?: Config;
    filter?: boolean;
};
export type UseBalancesReturnType = Balance[];
export declare function useBalances(parameters?: UseBalancesParameters): UseBalancesReturnType;
//# sourceMappingURL=useBalances.d.ts.map