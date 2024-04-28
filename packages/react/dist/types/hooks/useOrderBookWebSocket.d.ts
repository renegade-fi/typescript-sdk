import { type Config, type NetworkOrder } from "@renegade-fi/core";
export type UseOrderBookWebSocketParameters = {
    config?: Config;
};
export type UseOrderBookWebSocketReturnType = NetworkOrder[] | undefined;
export declare function useOrderBookWebSocket(parameters?: UseOrderBookWebSocketParameters): UseOrderBookWebSocketReturnType;
//# sourceMappingURL=useOrderBookWebSocket.d.ts.map