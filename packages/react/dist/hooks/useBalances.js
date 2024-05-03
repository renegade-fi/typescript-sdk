'use client';
import { getBalances } from '@renegade-fi/core';
import { useEffect, useState } from 'react';
import { useConfig } from './useConfig.js';
import { useWalletWebsocket } from './useWalletWebSocket.js';
import { useStatus } from './useStatus.js';
export function useBalances(parameters = {}) {
    const config = useConfig(parameters);
    const status = useStatus(parameters);
    const { filter = true } = parameters;
    const [balances, setBalances] = useState([]);
    const incomingWallet = useWalletWebsocket();
    useEffect(() => {
        if (status !== 'in relayer') {
            setBalances([]);
            return;
        }
        async function fetchBalance() {
            const initialBalance = await getBalances(config);
            setBalances(initialBalance);
        }
        fetchBalance();
        const interval = setInterval(fetchBalance, 5000);
        return () => clearInterval(interval);
    }, [status, config]);
    useEffect(() => {
        if (incomingWallet?.balances) {
            setBalances(incomingWallet.balances);
        }
    }, [incomingWallet]);
    if (filter) {
        return balances.filter((balance) => balance.mint !== '0x0' && balance.amount);
    }
    return balances;
}
//# sourceMappingURL=useBalances.js.map