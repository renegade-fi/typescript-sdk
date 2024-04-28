import type { Config, Order } from "@renegade-fi/core";
export type UseOrdersParameters = {
    config?: Config;
    filter?: boolean;
};
export type UseOrdersReturnType = Order[];
export declare function useOrders(parameters?: UseOrdersParameters): UseOrdersReturnType;
//# sourceMappingURL=useOrders.d.ts.map