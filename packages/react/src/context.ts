"use client";

import type { Config, State } from "@renegade-fi/core";
import { createContext, createElement } from "react";
import { Hydrate } from "./hydrate.js";

export const RenegadeContext = createContext<Config | undefined>(undefined);

export type RenegadeProviderProps = {
    config: Config;
    initialState?: State | undefined;
    reconnectOnMount?: boolean | undefined;
};

export function RenegadeProvider(parameters: React.PropsWithChildren<RenegadeProviderProps>) {
    const { children, config } = parameters;

    const props = { value: config };
    return createElement(
        Hydrate,
        parameters,
        createElement(RenegadeContext.Provider, props, children),
    );
}
