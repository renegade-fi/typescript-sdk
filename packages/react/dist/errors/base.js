import { BaseError as CoreError } from '@renegade-fi/core';
import { getVersion } from '../utils/getVersion.js';
export class BaseError extends CoreError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'RenegadeError'
        });
    }
    get docsBaseUrl() {
        return 'todo: put a docs link here';
    }
    get version() {
        return getVersion();
    }
}
//# sourceMappingURL=base.js.map