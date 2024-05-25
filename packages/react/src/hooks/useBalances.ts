'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { useWallet } from './useWallet.js'

export type UseBalancesParameters = {
  config?: Config
  filter?: boolean
}

export type UseBalancesReturnType = Balance[]

export function useBalances(
  parameters: UseBalancesParameters = {},
): UseBalancesReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useWallet()
  if (!wallet) return []
  if (filter) {
    return wallet.balances.filter(
      (balance) => balance.mint !== '0x0' && balance.amount,
    )
  }
  return wallet.balances
}
