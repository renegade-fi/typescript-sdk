import type { Evaluate, ExactPartial, Omit, UnionStrictOmit } from "@renegade-fi/core";
import { hashFn } from "@renegade-fi/core/query";
import {
    type DefaultError,
    type QueryKey,
    useInfiniteQuery as tanstack_useInfiniteQuery,
    useQuery as tanstack_useQuery,
    type UseInfiniteQueryOptions,
    type UseInfiniteQueryResult,
    type UseMutationOptions,
    type UseMutationResult,
    type UseQueryOptions,
    type UseQueryResult,
    useMutation,
} from "@tanstack/react-query";

export type UseMutationParameters<
    data = unknown,
    error = Error,
    variables = void,
    context = unknown,
> = Evaluate<
    Omit<
        UseMutationOptions<data, error, Evaluate<variables>, context>,
        "mutationFn" | "mutationKey" | "throwOnError"
    >
>;

export type UseMutationReturnType<
    data = unknown,
    error = Error,
    variables = void,
    context = unknown,
> = Evaluate<
    UnionStrictOmit<UseMutationResult<data, error, variables, context>, "mutate" | "mutateAsync">
>;

export { useMutation };

////////////////////////////////////////////////////////////////////////////////

export type UseQueryParameters<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryKey extends QueryKey = QueryKey,
> = Evaluate<
    ExactPartial<Omit<UseQueryOptions<queryFnData, error, data, queryKey>, "initialData">> & {
        // Fix `initialData` type
        initialData?:
            | UseQueryOptions<queryFnData, error, data, queryKey>["initialData"]
            | undefined;
    }
>;

export type UseQueryReturnType<data = unknown, error = DefaultError> = Evaluate<
    UseQueryResult<data, error> & {
        queryKey: QueryKey;
    }
>;

// Adding some basic customization.
// Ideally we don't have this function, but `import('@tanstack/react-query').useQuery` currently has some quirks where it is super hard to
// pass down the inferred `initialData` type because of it's discriminated overload in the on `useQuery`.
export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
    parameters: UseQueryParameters<queryFnData, error, data, queryKey> & {
        queryKey: QueryKey;
    },
): UseQueryReturnType<data, error> {
    const result = tanstack_useQuery({
        ...(parameters as any),
        queryKeyHashFn: hashFn, // for bigint support
    }) as UseQueryReturnType<data, error>;
    result.queryKey = parameters.queryKey;
    return result;
}

////////////////////////////////////////////////////////////////////////////////

export type UseInfiniteQueryParameters<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryData = queryFnData,
    queryKey extends QueryKey = QueryKey,
    pageParam = unknown,
> = Evaluate<
    Omit<
        UseInfiniteQueryOptions<queryFnData, error, data, queryData, queryKey, pageParam>,
        "initialData"
    > & {
        // Fix `initialData` type
        initialData?:
            | UseInfiniteQueryOptions<queryFnData, error, data, queryKey>["initialData"]
            | undefined;
    }
>;

export type UseInfiniteQueryReturnType<
    data = unknown,
    error = DefaultError,
> = UseInfiniteQueryResult<data, error> & {
    queryKey: QueryKey;
};

// Adding some basic customization.
export function useInfiniteQuery<queryFnData, error, data, queryKey extends QueryKey>(
    parameters: UseInfiniteQueryParameters<queryFnData, error, data, queryKey> & {
        queryKey: QueryKey;
    },
): UseInfiniteQueryReturnType<data, error> {
    const result = tanstack_useInfiniteQuery({
        ...(parameters as any),
        queryKeyHashFn: hashFn, // for bigint support
    }) as UseInfiniteQueryReturnType<data, error>;
    result.queryKey = parameters.queryKey;
    return result;
}
