import { reconnect } from './actions/reconnect.js';
export function hydrate(config, parameters) {
    const { initialState, reconnectOnMount } = parameters;
    // TODO: Handle initial state
    if (initialState && !config._internal.store.persist.hasHydrated())
        config.setState({
            ...initialState,
            status: reconnectOnMount ? 'looking up' : 'disconnected',
            seed: reconnectOnMount ? config.state.seed : undefined,
        });
    return {
        async onMount() {
            if (config._internal.ssr) {
                console.log('💧 SSR enabled, rehydrating state');
                await config._internal.store.persist.rehydrate();
            }
            if (reconnectOnMount) {
                console.log('🚝 Reconnecting on mount');
                reconnect(config, { id: config.state.id });
            }
        },
    };
}
//# sourceMappingURL=hydrate.js.map