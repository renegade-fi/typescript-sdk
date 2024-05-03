import {} from './createConfig.js';
import {} from './types/utils.js';
import { deserialize as deserialize_ } from './utils/deserialize.js';
import { serialize as serialize_ } from './utils/serialize.js';
export function createStorage(parameters) {
    const { deserialize = deserialize_, key: prefix = 'renegade', serialize = serialize_, storage = noopStorage, } = parameters;
    function unwrap(value) {
        if (value instanceof Promise)
            return value.then((x) => x).catch(() => null);
        return value;
    }
    return {
        ...storage,
        key: prefix,
        async getItem(key, defaultValue) {
            const value = storage.getItem(`${prefix}.${key}`);
            const unwrapped = await unwrap(value);
            if (unwrapped)
                return deserialize(unwrapped) ?? null;
            return (defaultValue ?? null);
        },
        async setItem(key, value) {
            const storageKey = `${prefix}.${key}`;
            if (value === null)
                await unwrap(storage.removeItem(storageKey));
            else
                await unwrap(storage.setItem(storageKey, serialize(value)));
        },
        async removeItem(key) {
            await unwrap(storage.removeItem(`${prefix}.${key}`));
        },
    };
}
export const noopStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};
//# sourceMappingURL=createStorage.js.map