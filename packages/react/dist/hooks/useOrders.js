'use client';
import { getOrders } from '@renegade-fi/core';
import { useEffect, useState } from 'react';
import { useConfig } from './useConfig.js';
import { useStatus } from './useStatus.js';
import { useWalletWebsocket } from './useWalletWebSocket.js';
export function useOrders(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const { filter = true } = parameters;
    const [orders, setOrders] = useState([]);
    const incomingWallet = useWalletWebsocket();
    useEffect(() => {
        if (status !== 'in relayer') {
            setOrders([]);
            return;
        }
        async function fetchOrders() {
            const initialOrders = await getOrders(config);
            setOrders(initialOrders);
        }
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [status, config]);
    useEffect(() => {
        if (incomingWallet?.orders) {
            setOrders(incomingWallet.orders);
        }
    }, [incomingWallet]);
    if (filter) {
        return orders.filter((order) => order.amount > 0);
    }
    return orders;
}
//# sourceMappingURL=useOrders.js.map