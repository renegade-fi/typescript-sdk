import { createStorage, noopStorage } from "./createStorage.js";
import invariant from "tiny-invariant";
import { createPublicClient, defineChain, http, } from "viem";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
export function createConfig(parameters) {
    const { relayerUrl, priceReporterUrl, httpPort = 3000, pollingInterval = 5000, ssr, storage = createStorage({
        storage: typeof window !== "undefined" && window.localStorage
            ? window.localStorage
            : noopStorage,
    }), websocketPort = 4000, } = parameters;
    invariant(parameters.utils, "Utils must be provided by the package if not supplied by the user.");
    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Create store
    /////////////////////////////////////////////////////////////////////////////////////////////////
    function getInitialState() {
        return {
            seed: undefined,
            status: "disconnected",
            id: undefined,
        };
    }
    const store = createStore(subscribeWithSelector(
    // only use persist middleware if storage exists
    storage
        ? persist(getInitialState, {
            name: "store",
            partialize(state) {
                // Only persist "critical" store properties to preserve storage size.
                return {
                    id: state.id,
                    seed: state.seed,
                    status: state.status,
                };
            },
            skipHydration: ssr,
            storage: storage,
        })
        : getInitialState));
    const getRenegadeChain = (_rpcUrl) => {
        const rpcUrl = _rpcUrl ??
            `https://${parameters.rpcUrl}` ??
            `https://${relayerUrl.includes("dev") ? "dev." : ""}sequencer.renegade.fi`;
        return defineChain({
            id: 473474,
            name: "Renegade Testnet",
            network: "Renegade Testnet",
            testnet: true,
            nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
            rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
            blockExplorers: { default: { name: "Explorer", url: "https://explorer.renegade.fi" } },
        });
    };
    return {
        utils: parameters.utils,
        relayerUrl,
        priceReporterUrl,
        darkPoolAddress: parameters.darkPoolAddress,
        getRenegadeChain,
        getRelayerBaseUrl: function (route = "") {
            const baseUrl = parameters.relayerUrl.includes("localhost")
                ? `http://127.0.0.1:${httpPort}/v0`
                : `https://${parameters.relayerUrl}:${httpPort}/v0`;
            const formattedRoute = route.startsWith("/") ? route : `/${route}`;
            return `${baseUrl}${formattedRoute}`;
        },
        getPriceReporterBaseUrl: function () {
            const baseUrl = parameters.priceReporterUrl.includes("localhost")
                ? `ws://127.0.0.1:${websocketPort}/`
                : `wss://${parameters.priceReporterUrl}:${websocketPort}/`;
            return baseUrl;
        },
        getWebsocketBaseUrl: function () {
            const baseUrl = parameters.relayerUrl.includes("localhost")
                ? `ws://127.0.0.1:${websocketPort}`
                : `wss://${parameters.relayerUrl}:${websocketPort}`;
            return baseUrl;
        },
        getViemClient: () => createPublicClient({
            chain: getRenegadeChain(),
            transport: http(),
        }),
        pollingInterval,
        get state() {
            return store.getState();
        },
        setState: (newState) => store.setState(newState),
        subscribe(selector, listener, options) {
            return store.subscribe(selector, listener, options ? { ...options, fireImmediately: options.emitImmediately } : undefined);
        },
        _internal: {
            store,
            ssr: Boolean(ssr),
        },
    };
}
//# sourceMappingURL=createConfig.js.map