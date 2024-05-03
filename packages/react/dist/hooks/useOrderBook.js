'use client';
import { getNetworkOrders } from '@renegade-fi/core';
import { useEffect, useState } from 'react';
import { useConfig } from './useConfig.js';
import { useOrderBookWebSocket } from './useOrderBookWebSocket.js';
export function useOrderBook(parameters = {}) {
    const config = useConfig(parameters);
    const [networkOrders, setNetworkOrders] = useState([]);
    const orderBook = useOrderBookWebSocket();
    useEffect(() => {
        async function fetchNetworkOrders() {
            const initialNetworkOrders = await getNetworkOrders(config);
            setNetworkOrders(initialNetworkOrders);
        }
        fetchNetworkOrders();
        const interval = setInterval(async () => {
            const updatedNetworkOrders = await getNetworkOrders(config);
            setNetworkOrders(updatedNetworkOrders);
        }, 5000); // Set interval to 5 second
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [config]);
    useEffect(() => {
        if (orderBook && orderBook.length > 0) {
            setNetworkOrders((currentOrders) => {
                const updatedOrderMap = new Map(orderBook.map((order) => [order.id, order]));
                return currentOrders
                    .map((order) => updatedOrderMap.get(order.id) || order)
                    .filter((order) => order !== undefined);
            });
        }
    }, [orderBook]);
    return networkOrders.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
}
//# sourceMappingURL=useOrderBook.js.map