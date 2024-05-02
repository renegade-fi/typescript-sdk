import { type Config } from "../createConfig.js";
import type { OldTask as Task } from "../types/wallet.js";
export type WaitForTaskCompletionParameters = {
    id: string;
};
export type WaitForTaskCompletionReturnType = Promise<undefined>;
export declare function waitForTaskCompletion(config: Config, parameters: WaitForTaskCompletionParameters, onStateChange?: (task: Task) => void): WaitForTaskCompletionReturnType;
//# sourceMappingURL=waitForTaskCompletion.d.ts.map