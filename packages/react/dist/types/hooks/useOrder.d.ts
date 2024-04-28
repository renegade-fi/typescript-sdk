import type { Config, Order } from "@renegade-fi/core";
export type UseOrderParameters = {
    config?: Config;
    id: string;
};
export type UseOrderReturnType = Order | undefined;
export declare function useOrder(parameters: UseOrderParameters): UseOrderReturnType;
//# sourceMappingURL=useOrder.d.ts.map