'use client';
import { ORDER_BOOK_ROUTE, } from '@renegade-fi/core';
import JSONBigint from 'json-bigint';
import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useConfig } from './useConfig.js';
export function useOrderBookWebSocket(parameters = {}) {
    const config = useConfig(parameters);
    const { getWebsocketBaseUrl } = config;
    const [order, setOrder] = useState();
    const { lastMessage, readyState, sendJsonMessage } = useWebSocket.default(getWebsocketBaseUrl(), {
        share: true,
        shouldReconnect: () => true,
    });
    useEffect(() => {
        if (readyState !== ReadyState.OPEN)
            return;
        const body = {
            method: 'subscribe',
            topic: ORDER_BOOK_ROUTE,
        };
        const message = {
            body,
            headers: {},
        };
        sendJsonMessage(message);
    }, [readyState, sendJsonMessage]);
    useEffect(() => {
        if (lastMessage) {
            try {
                const messageData = JSONBigint({ useNativeBigInt: true }).parse(lastMessage.data);
                if (messageData.topic === ORDER_BOOK_ROUTE &&
                    (messageData.event?.type === 'NewOrder' ||
                        messageData.event?.type === 'OrderStateChange') &&
                    messageData.event?.order) {
                    setOrder(messageData.event.order);
                }
            }
            catch (error) {
                console.error('Error parsing data in WebSocket:', lastMessage.data, error);
            }
        }
    }, [lastMessage]);
    return order;
}
//# sourceMappingURL=useOrderBookWebSocket.js.map