import { type Config } from "../createConfig.js";
export type WatchStatusParameters = {
    onChange(status: Config["state"]["status"], prevStatus: Config["state"]["status"]): void;
};
export type WatchStatusReturnType = () => void;
export declare function watchStatus(config: Config, parameters: WatchStatusParameters): WatchStatusReturnType;
//# sourceMappingURL=watchStatus.d.ts.map