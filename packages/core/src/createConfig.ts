import invariant from 'tiny-invariant'
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  createPublicClient,
  defineChain,
} from 'viem'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { type Mutate, type StoreApi, createStore } from 'zustand/vanilla'
import { type Storage, createStorage, noopStorage } from './createStorage.js'
import type { Evaluate, ExactPartial } from './types/utils.js'
import type * as rustUtils from './utils.d.ts'

export type CreateConfigParameters = {
  darkPoolAddress: Address
  priceReporterUrl: string
  relayerUrl: string
  httpPort?: number
  pollingInterval?: number
  rpcUrl: string
  ssr?: boolean | undefined
  storage?: Storage | null | undefined
  useInsecureTransport?: boolean
  utils?: typeof rustUtils
  websocketPort?: number
}

export function createConfig(parameters: CreateConfigParameters): Config {
  const {
    relayerUrl,
    priceReporterUrl,
    httpPort = 3000,
    pollingInterval = 5000,
    ssr,
    storage = createStorage({
      storage:
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : noopStorage,
    }),
    useInsecureTransport = false,
    websocketPort = 4000,
  } = parameters

  invariant(
    parameters.utils,
    'Utils must be provided by the package if not supplied by the user.',
  )

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Create store
  /////////////////////////////////////////////////////////////////////////////////////////////////

  function getInitialState(): State {
    return {
      seed: undefined,
      status: 'disconnected',
      id: undefined,
    }
  }

  let store = createStore(
    subscribeWithSelector(
      // only use persist middleware if storage exists
      storage
        ? persist(getInitialState, {
            name: 'store',
            partialize(state) {
              // Only persist "critical" store properties to preserve storage size.
              return {
                id: state.id,
                seed: state.seed,
                status: state.status,
              } satisfies PartializedState
            },
            skipHydration: ssr,
            storage: storage as Storage<Record<string, unknown>>,
          })
        : getInitialState,
    ),
  )

  function reinitializeStore(usePersist: boolean) {
    const currentStorage = createStorage({
      storage:
        usePersist && typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : noopStorage,
    })
    const prevState = store.getState()
    store = createStore(
      subscribeWithSelector(
        usePersist && currentStorage
          ? persist(store.getState, {
              name: 'store',
              partialize(state) {
                return {
                  id: state.id,
                  seed: state.seed,
                  status: state.status,
                } satisfies PartializedState
              },
              skipHydration: ssr,
              storage: currentStorage as Storage<Record<string, unknown>>,
            })
          : store.getState,
      ),
    )
    store.setState(prevState)
    if (!usePersist) {
      localStorage.removeItem('renegade.store')
    }
  }

  const getRenegadeChain = (_rpcUrl?: string) => {
    const rpcUrl =
      _rpcUrl ??
      `https://${parameters.rpcUrl}` ??
      `https://${relayerUrl.includes('dev') ? 'dev.' : ''}sequencer.renegade.fi`
    return defineChain({
      id: 473474,
      name: 'Renegade Testnet',
      network: 'Renegade Testnet',
      testnet: true,
      nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
      blockExplorers: {
        default: { name: 'Explorer', url: 'https://explorer.renegade.fi' },
      },
    })
  }

  return {
    utils: parameters.utils,
    relayerUrl,
    priceReporterUrl,
    darkPoolAddress: parameters.darkPoolAddress,
    getRenegadeChain,
    getRelayerBaseUrl: (route = '') => {
      const protocol =
        useInsecureTransport || parameters.relayerUrl.includes('localhost')
          ? 'http'
          : 'https'
      const baseUrl = parameters.relayerUrl.includes('localhost')
        ? `127.0.0.1:${httpPort}/v0`
        : `${parameters.relayerUrl}:${httpPort}/v0`
      const formattedRoute = route.startsWith('/') ? route : `/${route}`
      return `${protocol}://${baseUrl}${formattedRoute}`
    },
    getPriceReporterBaseUrl: () => {
      const baseUrl = parameters.priceReporterUrl.includes('localhost')
        ? `ws://127.0.0.1:${websocketPort}/`
        : `wss://${parameters.priceReporterUrl}:${websocketPort}/`
      return baseUrl
    },
    getPriceReporterHTTPBaseUrl: (route = '') => {
      const baseUrl = parameters.priceReporterUrl.includes('localhost')
        ? `http://127.0.0.1:${httpPort}`
        : `https://${parameters.priceReporterUrl}:${httpPort}`
      const formattedRoute = route.startsWith('/') ? route : `/${route}`
      return `${baseUrl}${formattedRoute}`
    },
    getWebsocketBaseUrl: () => {
      const protocol =
        useInsecureTransport || parameters.relayerUrl.includes('localhost')
          ? 'ws'
          : 'wss'
      const baseUrl = parameters.relayerUrl.includes('localhost')
        ? `127.0.0.1:${websocketPort}`
        : `${parameters.relayerUrl}:${websocketPort}`
      return `${protocol}://${baseUrl}`
    },
    getViemClient: () =>
      createPublicClient({
        chain: getRenegadeChain(),
        transport: http(),
      }),
    pollingInterval,
    get state() {
      return store.getState()
    },
    setState: (newState: State) => store.setState(newState),
    subscribe(selector, listener, options) {
      return store.subscribe(
        selector as unknown as (state: State) => any,
        listener,
        options
          ? { ...options, fireImmediately: options.emitImmediately }
          : undefined,
      )
    },
    reinitializeStore,
    _internal: {
      store,
      ssr: Boolean(ssr),
    },
  }
}

export type Config = {
  darkPoolAddress: Address
  getPriceReporterBaseUrl: () => string
  getPriceReporterHTTPBaseUrl: (route?: string) => string
  getRelayerBaseUrl: (route?: string) => string
  getRenegadeChain: (rpcUrl?: string) => Chain
  getWebsocketBaseUrl: () => string
  pollingInterval: number
  priceReporterUrl: string
  relayerUrl: string
  reinitializeStore: (usePersist: boolean) => void
  rpcUrl?: string
  setState: (newState: State) => void
  state: State
  subscribe<state>(
    selector: (state: State) => state,
    listener: (state: state, previousState: state) => void,
    options?:
      | {
          emitImmediately?: boolean | undefined
          equalityFn?: ((a: state, b: state) => boolean) | undefined
        }
      | undefined,
  ): () => void
  getViemClient: () => PublicClient
  utils: typeof rustUtils
  /**
   * Not part of versioned API, proceed with caution.
   * @internal
   */
  _internal: {
    readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>
    readonly ssr: boolean
  }
}

export interface State {
  seed?: Hex | undefined
  status?:
    | 'in relayer'
    | 'disconnected'
    | 'looking up'
    | 'creating wallet'
    | 'connecting'
  id?: string | undefined
}

export type PartializedState = Evaluate<
  ExactPartial<Pick<State, 'id' | 'seed' | 'status'>>
>
