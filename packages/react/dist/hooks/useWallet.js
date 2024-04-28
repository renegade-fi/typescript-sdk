"use client";
import { useConfig } from "./useConfig.js";
import { RENEGADE_AUTH_HEADER_NAME, RENEGADE_SIG_EXPIRATION_HEADER_NAME, WALLET_ROUTE, } from "@renegade-fi/core";
import JSONBigint from "json-bigint";
import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { getSkRoot, useStatus, useWalletId } from "../index.js";
export function useWallet(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const walletId = useWalletId();
    const { getWebsocketBaseUrl } = config;
    const [wallet, setWallet] = useState();
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
            topic: WALLET_ROUTE(walletId),
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
                if (messageData.topic === WALLET_ROUTE(walletId) &&
                    messageData.event?.type === "WalletUpdate" &&
                    messageData.event?.wallet)
                    setWallet(messageData.event.wallet);
            }
            catch (error) {
                console.error("Error parsing data in WebSocket:", lastMessage.data, error);
            }
        }
    }, [lastMessage, walletId]);
    return wallet;
}
//# sourceMappingURL=useWallet.js.map