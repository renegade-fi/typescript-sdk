"use client";
import { useConfig } from "./useConfig.js";
import { useWallet } from "./useWallet.js";
import { getOrders } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useStatus } from "../index.js";
export function useOrders(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const { filter = true } = parameters;
    const [orders, setOrders] = useState([]);
    const wallet = useWallet();
    useEffect(() => {
        if (status !== "in relayer")
            return;
        async function fetchOrders() {
            const initialOrders = await getOrders(config);
            setOrders(initialOrders);
        }
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [status, config]);
    useEffect(() => {
        if (wallet && wallet.orders) {
            setOrders(wallet.orders);
        }
    }, [wallet]);
    if (filter) {
        return orders.filter(order => order.amount > 0);
    }
    return orders;
}
//# sourceMappingURL=useOrders.js.map