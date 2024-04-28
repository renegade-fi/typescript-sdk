"use client";
import { useConfig } from "./useConfig.js";
import { RENEGADE_AUTH_HEADER_NAME, RENEGADE_SIG_EXPIRATION_HEADER_NAME, WS_WALLET_ORDERS_ROUTE, } from "@renegade-fi/core";
import JSONBigint from "json-bigint";
import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { getSkRoot, useStatus, useWalletId } from "../index.js";
export function useOrderHistoryWebSocket(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const walletId = useWalletId();
    const { getWebsocketBaseUrl } = config;
    const [incomingOrder, setIncomingOrder] = useState();
    const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(getWebsocketBaseUrl(), {
        share: true,
        shouldReconnect: () => true,
    });
    // Subscribe to wallet updates with auth headers
    useEffect(() => {
        if (readyState !== ReadyState.OPEN || !walletId || status !== "in relayer")
            return;
        const body = {
            method: "subscribe",
            topic: WS_WALLET_ORDERS_ROUTE(walletId),
        };
        const skRoot = getSkRoot(config);
        const [auth, expiration] = config.utils.build_auth_headers(skRoot, JSON.stringify(body), BigInt(Date.now()));
        const message = {
            headers: {
                [RENEGADE_AUTH_HEADER_NAME]: auth,
                [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
            },
            body,
        };
        sendJsonMessage(message);
    }, [readyState, walletId, status, sendJsonMessage, config]);
    useEffect(() => {
        if (lastMessage && walletId) {
            try {
                const messageData = JSONBigint({ useNativeBigInt: true }).parse(lastMessage.data);
                if (messageData.topic === WS_WALLET_ORDERS_ROUTE(walletId) &&
                    messageData.event?.type === "OrderMetadataUpdated" &&
                    messageData.event?.order)
                    setIncomingOrder(messageData.event.order);
            }
            catch (error) {
                console.error("Error parsing data in WebSocket:", lastMessage.data, error);
            }
        }
    }, [lastMessage, walletId]);
    return incomingOrder;
}
//# sourceMappingURL=useOrderHistoryWebSocket.js.map