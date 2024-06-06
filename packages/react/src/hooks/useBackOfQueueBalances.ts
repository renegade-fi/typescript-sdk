'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { useBackOfQueueWallet } from './useBackOfQueueWallet.js'

export type UseBackOfQueueBalancesParameters = {
  config?: Config
  filter?: boolean
}

export type UseBackOfQueueBalancesReturnType = Balance[]

export function useBackOfQueueBalances(
  parameters: UseBackOfQueueBalancesParameters = {},
): UseBackOfQueueBalancesReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useBackOfQueueWallet()
  if (!wallet) return []
  if (filter) {
    return wallet.balances.filter(
      (balance) => balance.mint !== '0x0' && balance.amount,
    )
  }
  return wallet.balances
}
