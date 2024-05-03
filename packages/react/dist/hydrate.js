'use client';
import { hydrate } from '@renegade-fi/core';
import { useEffect, useRef } from 'react';
export function Hydrate(parameters) {
    const { children, config, initialState, reconnectOnMount = true } = parameters;
    const { onMount } = hydrate(config, {
        initialState,
        reconnectOnMount,
    });
    // Hydrate for non-SSR
    if (!config._internal.ssr)
        onMount();
    // Hydrate for SSR
    const active = useRef(true);
    useEffect(() => {
        if (!active.current)
            return;
        // Initialize RustUtils.default() when the component mounts
        const initRustUtils = async () => {
            try {
                await config.utils.default();
                console.log('🦀 Rust utils initialized successfully');
                // Hydration needs to wait for WASM to initialize, causing state flash
                if (!config._internal.ssr)
                    return;
                onMount();
            }
            catch (error) {
                console.error('❌ Failed to initialize Rust utils', error);
            }
        };
        initRustUtils();
        return () => {
            active.current = false;
        };
    }, [onMount, config]);
    return children;
}
//# sourceMappingURL=hydrate.js.map