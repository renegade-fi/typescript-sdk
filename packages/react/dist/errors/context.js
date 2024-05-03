import { BaseError } from './base.js';
export class RenegadeProviderNotFoundError extends BaseError {
    constructor() {
        super('`useConfig` must be used within `RenegadeProvider`.', {
            docsPath: '/api/RenegadeProvider',
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'RenegadeProviderNotFoundError'
        });
    }
}
//# sourceMappingURL=context.js.map