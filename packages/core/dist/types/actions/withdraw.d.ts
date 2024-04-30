import { type Address } from "viem";
import { type Config } from "../createConfig.js";
export type WithdrawParameters = {
    mint: Address;
    amount: bigint;
    destinationAddr: Address;
};
export type WithdrawReturnType = Promise<{
    taskId: string;
}>;
export declare function withdraw(config: Config, parameters: WithdrawParameters): WithdrawReturnType;
//# sourceMappingURL=withdraw.d.ts.map