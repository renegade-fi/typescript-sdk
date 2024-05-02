"use client";
import { useConfig } from "./useConfig.js";
import { useOrderHistoryWebSocket } from "./useOrderHistoryWebSocket.js";
import { getOrderHistory } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useStatus } from "../index.js";
export function useOrderHistory(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const { sort } = parameters;
    const [orderHistory, setOrderHistory] = useState(new Map());
    const incomingOrder = useOrderHistoryWebSocket();
    useEffect(() => {
        if (status !== "in relayer")
            return;
        async function fetchOrderHistory() {
            const initialOrderHistory = await getOrderHistory(config);
            const orderMap = new Map(initialOrderHistory.map(order => [order.id, order]));
            setOrderHistory(orderMap);
        }
        fetchOrderHistory();
        // const interval = setInterval(fetchOrderHistory, 5000)
        // return () => clearInterval(interval)
    }, [status, config]);
    useEffect(() => {
        if (incomingOrder) {
            setOrderHistory(prev => new Map(prev).set(incomingOrder.id, incomingOrder));
        }
    }, [incomingOrder]);
    const sortedOrderHistory = Array.from(orderHistory.values());
    if (sort) {
        sortedOrderHistory.sort((a, b) => {
            if (sort === "asc") {
                return a.created - b.created;
            }
            else {
                return b.created - a.created;
            }
        });
    }
    return sortedOrderHistory;
}
//# sourceMappingURL=useOrderHistory.js.map