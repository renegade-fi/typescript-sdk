'use client';
import { useEffect, useState } from 'react';
import { useConfig } from './useConfig.js';
import { useStatus } from './useStatus.js';
export function useWalletId(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const [walletId, setWalletId] = useState(config.state.id);
    useEffect(() => {
        if (status !== 'in relayer')
            return;
        setWalletId(config.state.id);
        const unsubscribe = config.subscribe((state) => state.id, (s) => setWalletId(s));
        return () => {
            unsubscribe();
        };
    }, [status, config, config.state.id]);
    return walletId;
}
//# sourceMappingURL=useWalletId.js.map