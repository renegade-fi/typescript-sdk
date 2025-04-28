"use client";

import { type Config, watchStatus } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useConfig } from "./useConfig.js";

export type UseStatusParameters = {
    config?: Config;
};

export type UseStatusReturnType = Config["state"]["status"];

export function useStatus(parameters: UseStatusParameters = {}): UseStatusReturnType {
    const config = useConfig(parameters);
    const [status, setStatus] = useState(config.state.status);

    useEffect(() => {
        const unsubscribe = watchStatus(config, {
            onChange: (status) => {
                setStatus(status);
            },
        });
        return () => {
            unsubscribe();
        };
    }, [config]);

    return status;
}
