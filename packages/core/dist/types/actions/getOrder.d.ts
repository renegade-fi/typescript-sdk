import type { Config } from '../createConfig.js';
import type { Order } from '../types/wallet.js';
export type GetOrderParameters = {
    id: string;
};
export type GetOrderReturnType = Promise<Order>;
export declare function getOrder(config: Config, parameters: GetOrderParameters): GetOrderReturnType;
//# sourceMappingURL=getOrder.d.ts.map