import { type Config } from "../createConfig.js";
export type ReconnectParameters = {
    id?: string;
};
export type ReconnectReturnType = Promise<void>;
export declare function reconnect(config: Config, parameters: ReconnectParameters): ReconnectReturnType;
//# sourceMappingURL=reconnect.d.ts.map