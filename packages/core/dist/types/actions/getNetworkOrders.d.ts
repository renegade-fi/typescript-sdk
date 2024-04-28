import { type Config } from "../createConfig.js";
import type { NetworkOrder } from "../types/wallet.js";
export type GetNetworkOrdersParameters = {};
export type GetNetworkOrdersReturnType = Promise<NetworkOrder[]>;
export declare function getNetworkOrders(config: Config, parameters?: GetNetworkOrdersParameters): GetNetworkOrdersReturnType;
//# sourceMappingURL=getNetworkOrders.d.ts.map