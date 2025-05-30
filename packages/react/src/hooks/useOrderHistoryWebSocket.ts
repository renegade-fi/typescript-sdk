"use client";

import {
    type Config,
    type OrderMetadata,
    WS_WALLET_ORDERS_ROUTE,
    getSymmetricKey,
} from "@renegade-fi/core";
import { useEffect } from "react";
import { ReadyState } from "react-use-websocket";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket.js";
import { createSignedWebSocketRequest } from "../utils/websocket.js";
import { useWasmInitialized } from "../wasm.js";
import { useConfig } from "./useConfig.js";
import { useStatus } from "./useStatus.js";
import { useWalletId } from "./useWalletId.js";

export type UseOrderHistoryWebSocketParameters = {
    config?: Config;
    onUpdate?: (order: OrderMetadata) => void;
    enabled?: boolean;
};

export function useOrderHistoryWebSocket(parameters: UseOrderHistoryWebSocketParameters = {}) {
    const isWasmInitialized = useWasmInitialized();
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const walletId = useWalletId();
    const { getWebsocketBaseUrl } = config;
    const { enabled = true, onUpdate } = parameters;

    const { readyState, sendJsonMessage } = useWebSocket(
        getWebsocketBaseUrl(),
        {
            filter: () => false,
            onMessage(event) {
                try {
                    const messageData = JSON.parse(event.data, (key, value) => {
                        if (typeof value === "number" && key !== "price") {
                            return BigInt(value);
                        }
                        return value;
                    });
                    if (
                        walletId &&
                        messageData.topic === WS_WALLET_ORDERS_ROUTE(walletId) &&
                        messageData.event?.type === "OrderMetadataUpdated" &&
                        messageData.event?.order
                    )
                        onUpdate?.(messageData.event.order);
                } catch (_) {}
            },
            share: true,
            shouldReconnect: () => true,
        },
        enabled,
    );

    // Subscribe to wallet updates with auth headers
    useEffect(() => {
        // Capture the current (old) wallet id in a local variable
        const currentWalletId = walletId;

        if (
            !enabled ||
            !currentWalletId ||
            readyState !== ReadyState.OPEN ||
            status !== "in relayer" ||
            !isWasmInitialized
        )
            return;

        // Subscribe to wallet's order updates
        const body = {
            method: "subscribe" as const,
            topic: WS_WALLET_ORDERS_ROUTE(currentWalletId),
        } as const;

        const symmetricKey = getSymmetricKey(config);
        const message = createSignedWebSocketRequest(config, symmetricKey, body);
        sendJsonMessage(message);
    }, [enabled, walletId, readyState, status, isWasmInitialized, sendJsonMessage, config]);
}
