"use client";

import {
    type Config,
    type Task,
    WS_TASK_HISTORY_ROUTE,
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

export type UseTaskHistoryWebSocketParameters = {
    config?: Config;
    onUpdate?: (task: Task) => void;
    enabled?: boolean;
};

export function useTaskHistoryWebSocket(parameters: UseTaskHistoryWebSocketParameters = {}) {
    const isWasmInitialized = useWasmInitialized();
    const config = useConfig(parameters);
    const walletId = useWalletId();

    const { enabled = true, onUpdate } = parameters;

    const { readyState, sendJsonMessage } = useWebSocket(
        config?.getWebsocketBaseUrl() ?? "",
        {
            filter: () => false,
            onMessage(event) {
                try {
                    const messageData = parseBigJSON(event.data);
                    if (
                        walletId &&
                        messageData.topic === WS_TASK_HISTORY_ROUTE(walletId) &&
                        messageData.event?.type === "TaskHistoryUpdate" &&
                        messageData.event?.task
                    )
                        onUpdate?.(messageData.event.task);
                } catch (_) {}
            },
            share: true,
            shouldReconnect: () => Boolean(enabled && walletId),
        },
        enabled && !!config?.getWebsocketBaseUrl(),
    );

    const { data: isIndexed } = useIsIndexed();

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

        const body = {
            method: "subscribe",
            topic: WS_TASK_HISTORY_ROUTE(currentWalletId),
        } as const;

        const symmetricKey = getSymmetricKey(config);
        const subscriptionMessage = createSignedWebSocketRequest(config, symmetricKey, body);

        sendJsonMessage(subscriptionMessage);
    }, [enabled, walletId, readyState, isWasmInitialized, sendJsonMessage, config, isIndexed]);
}
