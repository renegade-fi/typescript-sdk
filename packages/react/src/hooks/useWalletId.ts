"use client";

import type { Config } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useConfig } from "./useConfig.js";
import { useStatus } from "./useStatus.js";

export type UseWalletIdParameters = {
    config?: Config;
};

export type UseWalletIdReturnType = string | undefined;

export function useWalletId(parameters: UseWalletIdParameters = {}): UseWalletIdReturnType {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const [walletId, setWalletId] = useState<string | undefined>(config?.state.id);

    useEffect(() => {
        if (!config || status !== "in relayer") return;
        setWalletId(config.state.id);
        const unsubscribe = config.subscribe(
            (state) => state.id,
            (s) => setWalletId(s),
        );
        return () => {
            unsubscribe();
        };
    }, [status, config]);

    return walletId;
}
