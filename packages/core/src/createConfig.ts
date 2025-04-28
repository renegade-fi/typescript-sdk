import invariant from "tiny-invariant";
import { http, type Address, type Hex, type PublicClient, createPublicClient } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { type Mutate, type StoreApi, createStore } from "zustand/vanilla";
import type { SupportedChainId } from "./chains/defaults.js";
import type { ExternalConfig } from "./createExternalKeyConfig.js";
import { type Storage, createStorage, noopStorage } from "./createStorage.js";
import type { Evaluate, ExactPartial } from "./types/utils.js";
import type * as rustUtils from "./utils.d.ts";
import { AuthType } from "./utils/websocket.js";

export type CreateConfigParameters = {
    chainId: SupportedChainId;
    darkPoolAddress: Address;
    priceReporterUrl: string;
    relayerUrl: string;
    httpPort?: number;
    pollingInterval?: number;
    ssr?: boolean | undefined;
    storage?: Storage | null | undefined;
    useInsecureTransport?: boolean;
    utils?: typeof rustUtils;
    websocketPort?: number;
    viemClient?: PublicClient;
    adminKey?: string;
};

export function createConfig(parameters: CreateConfigParameters): InternalConfig {
    const {
        relayerUrl,
        priceReporterUrl,
        httpPort = 3000,
        pollingInterval = 5000,
        ssr,
        storage = createStorage({
            storage:
                typeof window !== "undefined" && window.localStorage
                    ? window.localStorage
                    : noopStorage,
        }),
        useInsecureTransport = false,
        viemClient = createPublicClient({
            chain: arbitrumSepolia,
            transport: http(),
        }),
        websocketPort = 4000,
        adminKey,
    } = parameters;

    invariant(
        parameters.utils,
        "Utils must be provided by the package if not supplied by the user.",
    );

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Create store
    /////////////////////////////////////////////////////////////////////////////////////////////////

    function getInitialState(): State {
        return {
            seed: undefined,
            status: "disconnected",
            id: undefined,
        };
    }

    const store = createStore(
        subscribeWithSelector(
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
                          } satisfies PartializedState;
                      },
                      skipHydration: ssr,
                      storage: storage as Storage<Record<string, unknown>>,
                  })
                : getInitialState,
        ),
    );

    return {
        utils: parameters.utils,
        renegadeKeyType: "internal" as const,
        storage,
        relayerUrl,
        priceReporterUrl,
        darkPoolAddress: parameters.darkPoolAddress,
        getBaseUrl: (route = "") => {
            const protocol =
                useInsecureTransport || parameters.relayerUrl.includes("localhost")
                    ? "http"
                    : "https";
            const baseUrl = parameters.relayerUrl.includes("localhost")
                ? `127.0.0.1:${httpPort}/v0`
                : `${parameters.relayerUrl}:${httpPort}/v0`;
            const formattedRoute = route.startsWith("/") ? route : `/${route}`;
            return `${protocol}://${baseUrl}${formattedRoute}`;
        },
        getPriceReporterBaseUrl: () => {
            const baseUrl = parameters.priceReporterUrl.includes("localhost")
                ? `ws://127.0.0.1:${websocketPort}/`
                : `wss://${parameters.priceReporterUrl}:${websocketPort}/`;
            return baseUrl;
        },
        getPriceReporterHTTPBaseUrl: (route = "") => {
            const baseUrl = parameters.priceReporterUrl.includes("localhost")
                ? `http://127.0.0.1:${httpPort}`
                : `https://${parameters.priceReporterUrl}:${httpPort}`;
            const formattedRoute = route.startsWith("/") ? route : `/${route}`;
            return `${baseUrl}${formattedRoute}`;
        },
        getWebsocketBaseUrl: () => {
            const protocol =
                useInsecureTransport || parameters.relayerUrl.includes("localhost") ? "ws" : "wss";
            const baseUrl = parameters.relayerUrl.includes("localhost")
                ? `127.0.0.1:${websocketPort}`
                : `${parameters.relayerUrl}:${websocketPort}`;
            return `${protocol}://${baseUrl}`;
        },
        getSymmetricKey(type?: AuthType) {
            invariant(parameters.utils, "Utils are required");
            if (type === AuthType.Admin) {
                invariant(parameters.adminKey, "Admin key is required");
                const symmetricKey = parameters.utils.b64_to_hex_hmac_key(
                    parameters.adminKey,
                ) as Hex;
                invariant(symmetricKey, "Admin key is required");
                return symmetricKey;
            }
            const seed = store.getState().seed;
            invariant(seed, "Seed is required");
            return parameters.utils.get_symmetric_key(seed) as Hex;
        },
        pollingInterval,
        get state() {
            return store.getState();
        },
        setState(value) {
            let newState: State;
            if (typeof value === "function") newState = value(store.getState() as any);
            else newState = value;

            // Reset state if it got set to something not matching the base state
            const initialState = getInitialState();
            if (typeof newState !== "object") newState = initialState;
            const isCorrupt = Object.keys(initialState).some((x) => !(x in newState));
            if (isCorrupt) newState = initialState;

            store.setState(newState, true);
        },
        subscribe(selector, listener, options) {
            return store.subscribe(
                selector as unknown as (state: State) => any,
                listener,
                options ? { ...options, fireImmediately: options.emitImmediately } : undefined,
            );
        },
        viemClient,
        adminKey,
        _internal: {
            store,
            ssr: Boolean(ssr),
        },
        chainId: parameters.chainId,
    };
}

export type BaseConfig = {
    utils: typeof rustUtils;
    getWebsocketBaseUrl: () => string;
    getBaseUrl: (route?: string) => string;
    getSymmetricKey: (type?: AuthType) => Hex;
};

export type Config = BaseConfig & {
    chainId: SupportedChainId;
    renegadeKeyType: "internal";
    readonly storage: Storage | null;
    darkPoolAddress: Address;
    getPriceReporterBaseUrl: () => string;
    getPriceReporterHTTPBaseUrl: (route?: string) => string;
    pollingInterval: number;
    priceReporterUrl: string;
    relayerUrl: string;
    setState(value: State | ((state: State) => State)): void;
    state: State;
    subscribe<state>(
        selector: (state: State) => state,
        listener: (state: state, previousState: state) => void,
        options?:
            | {
                  emitImmediately?: boolean | undefined;
                  equalityFn?: ((a: state, b: state) => boolean) | undefined;
              }
            | undefined,
    ): () => void;
    viemClient: PublicClient;
    adminKey?: string;
    /**
     * Not part of versioned API, proceed with caution.
     * @internal
     */
    _internal: {
        readonly store: Mutate<StoreApi<any>, [["zustand/persist", any]]>;
        readonly ssr: boolean;
    };
};

// For backwards-compatibility
export type InternalConfig = Config;

export type RenegadeConfig = InternalConfig | ExternalConfig;

export interface State {
    seed?: Hex | undefined;
    status?: "in relayer" | "disconnected" | "looking up" | "creating wallet" | "connecting";
    id?: string | undefined;
}

// The type of keychain a config is using
export const keyTypes = {
    EXTERNAL: "external",
    INTERNAL: "internal",
    NONE: "none",
} as const;

export type PartializedState = Evaluate<ExactPartial<Pick<State, "id" | "seed" | "status">>>;
