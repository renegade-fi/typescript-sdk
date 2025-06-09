"use client";

import {
    type Config,
    WALLET_ROUTE,
    type Wallet,
    getSymmetricKey,
    parseBigJSON,
} from "@renegade-fi/core";
import { useEffect } from "react";
import { ReadyState } from "react-use-websocket";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket.js";
import { createSignedWebSocketRequest } from "../utils/websocket.js";
import { useWasmInitialized } from "../wasm.js";
import { useConfig } from "./useConfig.js";
import { useIsIndexed } from "./useIsIndexed.js";
import { useWalletId } from "./useWalletId.js";

export type UseWalletParameters = {
    config?: Config;
    onUpdate?: (wallet: Wallet) => void;
    enabled?: boolean;
};

export function useWalletWebsocket(parameters: UseWalletParameters = {}) {
    const isWasmInitialized = useWasmInitialized();
    const config = useConfig(parameters);
    const walletId = useWalletId();
    const { enabled = true, onUpdate } = parameters;

    const { readyState, sendJsonMessage } = useWebSocket(
        config?.getWebsocketBaseUrl() ?? "",
        {
            filter: () => false,
            onMessage: (event) => {
                try {
                    const messageData = parseBigJSON(event.data);
                    if (
                        walletId &&
                        messageData.topic === WALLET_ROUTE(walletId) &&
                        messageData.event?.type === "WalletUpdate" &&
                        messageData.event?.wallet
                    )
                        onUpdate?.(messageData.event.wallet);
                } catch (_) {}
            },
            share: true,
            shouldReconnect: () => true,
        },
        enabled && !!config?.getWebsocketBaseUrl(),
    );

    const { data: isIndexed } = useIsIndexed();
    // Subscribe to wallet updates with auth headers
    useEffect(() => {
        // Capture the current (old) wallet id in a local variable
        const currentWalletId = walletId;

        if (
            !enabled ||
            !currentWalletId ||
            readyState !== ReadyState.OPEN ||
            !isWasmInitialized ||
            !config ||
            !config.state.seed ||
            !isIndexed
        )
            return;

        // Subscribe to wallet updates
        const body = {
            method: "subscribe",
            topic: WALLET_ROUTE(currentWalletId),
        } as const;

        const symmetricKey = getSymmetricKey(config);
        const subscriptionMessage = createSignedWebSocketRequest(config, symmetricKey, body);

        sendJsonMessage(subscriptionMessage);
    }, [enabled, walletId, readyState, isWasmInitialized, sendJsonMessage, config, isIndexed]);
}
