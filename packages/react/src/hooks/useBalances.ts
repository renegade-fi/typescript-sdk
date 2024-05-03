'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { getBalances } from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import { useConfig } from './useConfig.js'
import { useWalletWebsocket } from './useWalletWebSocket.js'
import { useStatus } from './useStatus.js'

export type UseBalancesParameters = {
  config?: Config
  filter?: boolean
}

export type UseBalancesReturnType = Balance[]

export function useBalances(
  parameters: UseBalancesParameters = {},
): UseBalancesReturnType {
  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const { filter = true } = parameters
  const [balances, setBalances] = useState<Balance[]>([])
  const incomingWallet = useWalletWebsocket()

  useEffect(() => {
    if (status !== 'in relayer') {
      setBalances([])
      return
    }

    async function fetchBalance() {
      const initialBalance = await getBalances(config)
      setBalances(initialBalance)
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)

    return () => clearInterval(interval)
  }, [status, config])

  useEffect(() => {
    if (incomingWallet?.balances) {
      setBalances(incomingWallet.balances)
    }
  }, [incomingWallet])

  if (filter) {
    return balances.filter(
      (balance) => balance.mint !== '0x0' && balance.amount,
    )
  }
  return balances
}
