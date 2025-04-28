"use client";

import type { Balance, Config } from "@renegade-fi/core";
import { useWallet } from "./useWallet.js";

export type UseBalancesParameters = {
    config?: Config;
    filterDefaults?: boolean;
};

export type UseBalancesReturnType = Balance[];

export function useBalances(parameters: UseBalancesParameters = {}): UseBalancesReturnType {
    const { filterDefaults = true } = parameters;
    const { data } = useWallet({ filterDefaults });
    if (!data) return [];
    return data.balances;
}
