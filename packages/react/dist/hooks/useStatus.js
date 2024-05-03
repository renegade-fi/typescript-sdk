'use client';
import { watchStatus } from '@renegade-fi/core';
import { useEffect, useState } from 'react';
import { useConfig } from './useConfig.js';
export function useStatus(parameters = {}) {
    const config = useConfig(parameters);
    const [status, setStatus] = useState(config.state.status);
    useEffect(() => {
        const unsubscribe = watchStatus(config, {
            onChange: (status) => {
                setStatus(status);
            },
        });
        return () => {
            unsubscribe();
        };
    }, [config]);
    return status;
}
//# sourceMappingURL=useStatus.js.map