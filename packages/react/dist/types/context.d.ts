/// <reference types="react" />
import type { Config, State } from '@renegade-fi/core';
export declare const RenegadeContext: import("react").Context<Config | undefined>;
export type RenegadeProviderProps = {
    config: Config;
    initialState?: State | undefined;
    reconnectOnMount?: boolean | undefined;
};
export declare function RenegadeProvider(parameters: React.PropsWithChildren<RenegadeProviderProps>): import("react").FunctionComponentElement<import("react").PropsWithChildren<import("./hydrate.js").HydrateProps>>;
//# sourceMappingURL=context.d.ts.map