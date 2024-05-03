import { type Address, type Chain, type Hex, type PublicClient } from 'viem';
import { type Mutate, type StoreApi } from 'zustand/vanilla';
import { type Storage } from './createStorage.js';
import type { Evaluate, ExactPartial } from './types/utils.js';
import type * as rustUtils from './utils.d.ts';
export type CreateConfigParameters = {
    darkPoolAddress: Address;
    priceReporterUrl: string;
    relayerUrl: string;
    httpPort?: number;
    pollingInterval?: number;
    rpcUrl: string;
    ssr?: boolean | undefined;
    storage?: Storage | null | undefined;
    utils?: typeof rustUtils;
    websocketPort?: number;
};
export declare function createConfig(parameters: CreateConfigParameters): Config;
export type Config = {
    darkPoolAddress: Address;
    getPriceReporterBaseUrl: () => string;
    getRelayerBaseUrl: (route?: string) => string;
    getRenegadeChain: (rpcUrl?: string) => Chain;
    getWebsocketBaseUrl: () => string;
    pollingInterval: number;
    priceReporterUrl: string;
    relayerUrl: string;
    rpcUrl?: string;
    setState: (newState: State) => void;
    state: State;
    subscribe<state>(selector: (state: State) => state, listener: (state: state, previousState: state) => void, options?: {
        emitImmediately?: boolean | undefined;
        equalityFn?: ((a: state, b: state) => boolean) | undefined;
    } | undefined): () => void;
    getViemClient: () => PublicClient;
    utils: typeof rustUtils;
    /**
     * Not part of versioned API, proceed with caution.
     * @internal
     */
    _internal: {
        readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>;
        readonly ssr: boolean;
    };
};
export interface State {
    seed?: Hex | undefined;
    status?: 'in relayer' | 'disconnected' | 'looking up' | 'creating wallet' | 'connecting';
    id?: string | undefined;
}
export type PartializedState = Evaluate<ExactPartial<Pick<State, 'id' | 'seed' | 'status'>>>;
//# sourceMappingURL=createConfig.d.ts.map