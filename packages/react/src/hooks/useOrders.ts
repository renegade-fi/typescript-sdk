"use client";

import type { Config, Order } from "@renegade-fi/core";
import { useWallet } from "./useWallet.js";

export type UseOrdersParameters = {
    config?: Config;
    filter?: boolean;
};

export type UseOrdersReturnType = Map<string, Order>;

export function useOrders(parameters: UseOrdersParameters = {}): UseOrdersReturnType {
    const { filter = true } = parameters;
    const { data: wallet } = useWallet();
    if (!wallet?.orders) return new Map();
    let orders = wallet.orders;
    if (filter) {
        orders = orders.filter((order) => order.amount > 0);
    }
    return new Map(orders.map((order) => [order.id, order]));
}
