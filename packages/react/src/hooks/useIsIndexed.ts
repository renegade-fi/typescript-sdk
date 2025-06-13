import { getWalletFromRelayer } from "@renegade-fi/core";
import { useQuery } from "@tanstack/react-query";
import { useWasmInitialized } from "../wasm.js";
import { useConfig } from "./useConfig.js";
import { useWalletId } from "./useWalletId.js";

/**
 * Checks if the wallet is indexed in the relayer.
 * This is necessary to subscribe to topics once a wallet is indexed.
 * The query runs every 2 seconds until the wallet is indexed, or 30 times (1 minute) if the wallet is not indexed.
 * This is fine because in most cases the wallet is indexed in << 1 minute.
 * If after 1 minute the wallet is not indexed, there is a higher level issue that should be addressed.
 */
export function useIsIndexed() {
    const config = useConfig();
    const walletId = useWalletId();
    const isWasmInitialized = useWasmInitialized();

    return useQuery<boolean>({
        queryKey: ["wallet", "is-indexed", walletId],
        queryFn: async () => {
            if (!walletId || !isWasmInitialized || !config) throw new Error("Invalid state");
            return getWalletFromRelayer(config).then((wallet) => !!wallet.id);
        },
        refetchInterval: (query) => {
            return query.state.data === true ? false : 2000;
        },
        staleTime: Number.POSITIVE_INFINITY,
        enabled: !!walletId && !!isWasmInitialized && !!config,
        retry: 30,
    });
}
