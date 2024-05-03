import type { Config } from '../createConfig.js';
export type CancelOrderParameters = {
    id: string;
};
export type CancelOrderReturnType = Promise<{
    taskId: string;
}>;
export declare function cancelOrder(config: Config, parameters: CancelOrderParameters): CancelOrderReturnType;
//# sourceMappingURL=cancelOrder.d.ts.map