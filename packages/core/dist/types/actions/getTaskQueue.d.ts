import { type Config } from "../createConfig.js";
import type { OldTask as Task } from "../types/wallet.js";
export type GetTaskQueueParameters = {};
export type GetTaskQueueReturnType = Promise<Task[]>;
export declare function getTaskQueue(config: Config, parameters?: GetTaskQueueParameters): GetTaskQueueReturnType;
//# sourceMappingURL=getTaskQueue.d.ts.map