import { type Config } from "../createConfig.js";
import type { Order } from "../types/wallet.js";
export type GetOrdersParameters = {};
export type GetOrdersReturnType = Promise<Order[]>;
export declare function getOrders(config: Config, parameters?: GetOrdersParameters): GetOrdersReturnType;
//# sourceMappingURL=getOrders.d.ts.map