import { BaseError as CoreError } from '@renegade-fi/core';
export type BaseErrorType = BaseError & {
    name: 'RenegadeError';
};
export declare class BaseError extends CoreError {
    name: string;
    get docsBaseUrl(): string;
    get version(): string;
}
//# sourceMappingURL=base.d.ts.map