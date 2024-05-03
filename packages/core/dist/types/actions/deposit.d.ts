import { type Address } from 'viem';
import type { Config } from '../createConfig.js';
export type DepositParameters = {
    fromAddr: Address;
    mint: Address;
    amount: bigint;
    permitNonce: bigint;
    permitDeadline: bigint;
    permit: `0x${string}`;
};
export type DepositReturnType = Promise<{
    taskId: string;
}>;
export declare function deposit(config: Config, parameters: DepositParameters): DepositReturnType;
//# sourceMappingURL=deposit.d.ts.map