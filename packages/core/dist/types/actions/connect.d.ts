import type { Hex } from "viem";
import { type Config } from "../createConfig.js";
export type ConnectParameters = {
    seed?: Hex;
};
export type ConnectReturnType = Promise<{
    taskId: string;
} | undefined>;
export declare function connect(config: Config, parameters?: ConnectParameters): ConnectReturnType;
//# sourceMappingURL=connect.d.ts.map