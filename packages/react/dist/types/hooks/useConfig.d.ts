import type { Config } from '@renegade-fi/core';
import type { ConfigParameter } from '../types/properties.js';
export type UseConfigParameters<config extends Config = Config> = ConfigParameter<config>;
export type UseConfigReturnType<config extends Config = Config> = config;
export declare function useConfig<config extends Config = Config>(parameters?: UseConfigParameters<config>): UseConfigReturnType<config>;
//# sourceMappingURL=useConfig.d.ts.map