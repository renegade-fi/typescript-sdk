import { type Config } from '@renegade-fi/core';
export type UseStatusParameters = {
    config?: Config;
};
export type UseStatusReturnType = Config['state']['status'];
export declare function useStatus(parameters?: UseStatusParameters): UseStatusReturnType;
//# sourceMappingURL=useStatus.d.ts.map