import { type Address } from 'viem';
import type { Config } from '../createConfig.js';
export type CreateOrderParameters = {
    id?: string;
    base: Address;
    quote: Address;
    side: 'buy' | 'sell';
    amount: bigint;
};
export type CreateOrderReturnType = Promise<{
    taskId: string;
}>;
export declare function createOrder(config: Config, parameters: CreateOrderParameters): CreateOrderReturnType;
//# sourceMappingURL=createOrder.d.ts.map