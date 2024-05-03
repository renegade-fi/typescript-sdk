'use client';
import { createContext, createElement } from 'react';
import { Hydrate } from './hydrate.js';
export const RenegadeContext = createContext(undefined);
export function RenegadeProvider(parameters) {
    const { children, config } = parameters;
    const props = { value: config };
    return createElement(Hydrate, parameters, createElement(RenegadeContext.Provider, props, children));
}
//# sourceMappingURL=context.js.map