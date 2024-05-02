import { type Config } from "../createConfig.js";
import type { OldTask as Task } from "../types/wallet.js";
export type GetTaskStatusParameters = {
    id: string;
};
export type GetTaskStatusReturnType = Promise<Task>;
export declare function getTaskStatus(config: Config, parameters: GetTaskStatusParameters): GetTaskStatusReturnType;
//# sourceMappingURL=getTaskStatus.d.ts.map