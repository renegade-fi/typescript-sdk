import type { Config, OrderMetadata } from '@renegade-fi/core';
export type UseOrderHistoryParameters = {
    config?: Config;
    sort?: 'asc' | 'desc';
};
export type UseOrderHistoryReturnType = OrderMetadata[];
export declare function useOrderHistory(parameters?: UseOrderHistoryParameters): UseOrderHistoryReturnType;
//# sourceMappingURL=useOrderHistory.d.ts.map