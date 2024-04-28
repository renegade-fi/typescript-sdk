import { type Config } from "../createConfig.js";
import type { OrderMetadata } from "../types/wallet.js";
export type GetOrderHistoryParameters = {};
export type GetOrderHistoryReturnType = Promise<OrderMetadata[]>;
export declare function getOrderHistory(config: Config, parameters?: GetOrderHistoryParameters): GetOrderHistoryReturnType;
//# sourceMappingURL=getOrderHistory.d.ts.map