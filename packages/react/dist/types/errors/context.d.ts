import { BaseError } from "./base.js";
export type RenegadeProviderNotFoundErrorType = RenegadeProviderNotFoundError & {
    name: "RenegadeProviderNotFoundError";
};
export declare class RenegadeProviderNotFoundError extends BaseError {
    name: string;
    constructor();
}
//# sourceMappingURL=context.d.ts.map