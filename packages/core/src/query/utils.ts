import { type QueryKey, replaceEqualDeep } from "@tanstack/query-core";
import { deepEqual } from "../utils/deepEqual.js";

export function structuralSharing<data>(oldData: data | undefined, newData: data): data {
    if (deepEqual(oldData, newData)) return oldData as data;
    return replaceEqualDeep(oldData, newData);
}

export function hashFn(queryKey: QueryKey): string {
    return JSON.stringify(queryKey, (_, value) => {
        if (isPlainObject(value))
            return Object.keys(value)
                .sort()
                .reduce((result, key) => {
                    result[key] = value[key];
                    return result;
                }, {} as any);
        if (typeof value === "bigint") return value.toString();
        return value;
    });
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
function isPlainObject(o: any): o is Object {
    if (!hasObjectPrototype(o)) {
        return false;
    }

    // If has modified constructor
    const ctor = o.constructor;
    if (typeof ctor === "undefined") return true;

    // If has modified prototype
    const prot = ctor.prototype;
    if (!hasObjectPrototype(prot)) return false;

    // If constructor does not have an Object-specific method
    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
    if (!prot.hasOwnProperty("isPrototypeOf")) return false;

    // Most likely a plain Object
    return true;
}

function hasObjectPrototype(o: any): boolean {
    return Object.prototype.toString.call(o) === "[object Object]";
}

export function filterQueryOptions<type extends Record<string, unknown>>(options: type): type {
    // biome-ignore-start lint/correctness/noUnusedVariables: <explanation>
    const {
        _defaulted,
        behavior,
        gcTime,
        initialData,
        initialDataUpdatedAt,
        maxPages,
        meta,
        networkMode,
        queryFn,
        queryHash,
        queryKey,
        queryKeyHashFn,
        retry,
        retryDelay,
        structuralSharing,

        getPreviousPageParam,
        getNextPageParam,
        initialPageParam,

        _optimisticResults,
        enabled,
        notifyOnChangeProps,
        placeholderData,
        refetchInterval,
        refetchIntervalInBackground,
        refetchOnMount,
        refetchOnReconnect,
        refetchOnWindowFocus,
        retryOnMount,
        select,
        staleTime,
        suspense,
        throwOnError,

        config,
        connector,
        query,
        ...rest
    } = options;
    // biome-ignore-end lint/correctness/noUnusedVariables: <explanation>

    return rest as type;
}

export type ScopeKeyParameter = { scopeKey?: string | undefined };
