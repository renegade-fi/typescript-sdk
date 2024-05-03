import { type PartializedState } from './createConfig.js';
import { type Evaluate } from './types/utils.js';
export type StorageItemMap = {
    recentConnectorId: string;
    state: PartializedState;
};
export type Storage<itemMap extends Record<string, unknown> = {}, storageItemMap extends StorageItemMap = StorageItemMap & itemMap> = {
    key: string;
    getItem<key extends keyof storageItemMap, value extends storageItemMap[key], defaultValue extends value | null | undefined>(key: key, defaultValue?: defaultValue | undefined): (defaultValue extends null ? value | null : value) | Promise<defaultValue extends null ? value | null : value>;
    setItem<key extends keyof storageItemMap, value extends storageItemMap[key] | null>(key: key, value: value): void | Promise<void>;
    removeItem(key: keyof storageItemMap): void | Promise<void>;
};
export type BaseStorage = {
    getItem(key: string): string | null | undefined | Promise<string | null | undefined>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
};
export type CreateStorageParameters = {
    deserialize?: (<T>(value: string) => T) | undefined;
    key?: string | undefined;
    serialize?: (<T>(value: T) => string) | undefined;
    storage?: Evaluate<BaseStorage> | undefined;
};
export declare function createStorage<itemMap extends Record<string, unknown> = {}, storageItemMap extends StorageItemMap = StorageItemMap & itemMap>(parameters: CreateStorageParameters): Evaluate<Storage<storageItemMap>>;
export declare const noopStorage: {
    getItem: () => null;
    setItem: () => void;
    removeItem: () => void;
};
//# sourceMappingURL=createStorage.d.ts.map