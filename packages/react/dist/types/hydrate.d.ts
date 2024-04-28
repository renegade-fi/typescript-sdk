import { type Config } from "@renegade-fi/core";
import { type State } from "@renegade-fi/core";
import { type ReactElement } from "react";
export type HydrateProps = {
    config: Config;
    initialState?: State | undefined;
    reconnectOnMount?: boolean | undefined;
};
export declare function Hydrate(parameters: React.PropsWithChildren<HydrateProps>): ReactElement<any, string | import("react").JSXElementConstructor<any>>;
//# sourceMappingURL=hydrate.d.ts.map