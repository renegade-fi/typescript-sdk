"use client";

import type { Config } from "@renegade-fi/core";
import { hydrate, type State } from "@renegade-fi/core";
import { createElement, type ReactElement, useEffect, useRef, useState } from "react";
import * as RustUtils from "../renegade-utils/index.js";
import { WasmContext } from "./wasm.js";

export type HydrateProps = {
    config: Config | undefined;
    initialState?: State | undefined;
    reconnectOnMount?: boolean | undefined;
};

export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
    const { children, config, initialState, reconnectOnMount = true } = parameters;
    const [isInitialized, setIsInitialized] = useState(false);

    const { onMount } = hydrate(config, {
        initialState,
        reconnectOnMount,
    });

    // Hydrate for non-SSR
    if (config && !config._internal.ssr) onMount();

    useEffect(() => {
        RustUtils.default().then(() => {
            setIsInitialized(true);
            console.log("Backup effect initialized WASM");
        });
    }, []);

    // Hydrate for SSR
    const active = useRef(true);
    // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to initialize once on mount
    useEffect(() => {
        if (!config) return;
        config.utils
            .default()
            .then(() => {
                console.log("🚀 ~ WASM initialized");
                setIsInitialized(true);
                if (!active.current) return;
                if (!config._internal.ssr) return;
                // Rehydrate after WASM is initialized to prevent race condition
                onMount();
            })
            .catch((error: unknown) => {
                console.error("❌ Failed to initialize Rust utils", error);
            });
        return () => {
            active.current = false;
        };
    }, []);

    return createElement(
        WasmContext.Provider,
        { value: { isInitialized } },
        children as ReactElement,
    );
}
