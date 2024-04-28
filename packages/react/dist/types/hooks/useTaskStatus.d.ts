import { type Config, type Task } from "@renegade-fi/core";
export type UseTaskStatusParameters = {
    config?: Config;
    taskId?: string;
};
export type UseTaskStatusReturnType = Task | undefined;
export declare function useTaskStatus(parameters: UseTaskStatusParameters): UseTaskStatusReturnType;
//# sourceMappingURL=useTaskStatus.d.ts.map