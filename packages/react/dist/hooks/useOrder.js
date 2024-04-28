"use client";
import { useConfig } from "./useConfig.js";
import { getOrder } from "@renegade-fi/core";
import { useEffect, useState } from "react";
import { useStatus } from "../index.js";
export function useOrder(parameters) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const [order, setOrder] = useState();
    useEffect(() => {
        if (status !== "in relayer")
            return;
        async function fetchOrder() {
            const initialOrder = await getOrder(config, { id: parameters.id });
            setOrder(initialOrder);
        }
        fetchOrder();
        const interval = setInterval(async () => {
            const updatedOrder = await getOrder(config, { id: parameters.id });
            setOrder(updatedOrder);
        }, 1000); // Set interval to 1 second
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [status, parameters.id]);
    return order;
}
//# sourceMappingURL=useOrder.js.map