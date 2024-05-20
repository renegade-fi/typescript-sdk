'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { useBalances } from './useBalances.js'

export type UseFeesParameters = {
  config?: Config
  filter?: boolean
}

export type UseFeesReturnType = Balance[]

export function useFees(parameters: UseFeesParameters = {}): UseFeesReturnType {
  const { filter = true } = parameters
  const balances = useBalances({ filter: false })

  if (filter) {
    return balances.filter(
      (balance) => balance.protocol_fee_balance || balance.relayer_fee_balance,
    )
  }

  return balances
}
