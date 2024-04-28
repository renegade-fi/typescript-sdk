"use client";
import { useConfig } from "./useConfig.js";
import { watchStatus } from "@renegade-fi/core";
import { useEffect, useState } from "react";
export function useStatus(parameters = {}) {
    const config = useConfig(parameters);
    const [status, setStatus] = useState(config.state.status);
    useEffect(() => {
        const unsubscribe = watchStatus(config, {
            onChange: status => {
                setStatus(status);
            },
        });
        return () => {
            unsubscribe();
        };
    }, [config.state.status]);
    return status;
}
//# sourceMappingURL=useStatus.js.map