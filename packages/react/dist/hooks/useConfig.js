"use client";
import {} from "@renegade-fi/core";
import { useContext } from "react";
import { RenegadeContext } from "../context.js";
import { RenegadeProviderNotFoundError } from "../errors/context.js";
export function useConfig(parameters = {}) {
    const config = parameters.config ?? useContext(RenegadeContext);
    if (!config)
        throw new RenegadeProviderNotFoundError();
    return config;
}
//# sourceMappingURL=useConfig.js.map