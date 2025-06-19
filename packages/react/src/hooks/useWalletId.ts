"use client";

import type { Config } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useConfig } from "./useConfig.js";

export type UseWalletIdParameters = {
    config?: Config;
};

export type UseWalletIdReturnType = string | undefined;

export function useWalletId(parameters: UseWalletIdParameters = {}): UseWalletIdReturnType {
    const config = useConfig(parameters);
    const [walletId, setWalletId] = useState<string | undefined>(config?.state.id);

    useEffect(() => {
        if (!config) return;
        setWalletId(config.state.id);
        const unsubscribe = config.subscribe(
            (state) => state.id,
            (s) => setWalletId(s),
        );
        return () => {
            unsubscribe();
        };
    }, [config]);

    return walletId;
}
