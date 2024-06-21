'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { useWallet } from './useWallet.js'

export type UseBalancesParameters = {
  config?: Config
  filter?: boolean
}

export type UseBalancesReturnType = Map<string, Balance>

export function useBalances(
  parameters: UseBalancesParameters = {},
): UseBalancesReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useWallet()
  if (!wallet?.balances) return new Map()
  let balances = wallet.balances
  if (filter) {
    balances = balances.filter(
      (balance) => balance.mint !== '0x0' && balance.amount,
    )
  }
  return new Map(balances.map((balance) => [balance.mint, balance]))
}
