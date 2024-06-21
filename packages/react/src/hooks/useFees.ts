'use client'

import type { Balance, Config } from '@renegade-fi/core'
import { useWallet } from './useWallet.js'

export type UseFeesParameters = {
  config?: Config
  filter?: boolean
}

export type UseFeesReturnType = Map<string, Balance>

export function useFees(parameters: UseFeesParameters = {}): UseFeesReturnType {
  const { filter = true } = parameters
  const { data: wallet } = useWallet()
  if (!wallet?.balances) return new Map()
  let balances = wallet.balances
  if (filter) {
    balances = balances.filter(
      (balance) => balance.protocol_fee_balance || balance.relayer_fee_balance,
    )
  }
  return new Map(balances.map((balance) => [balance.mint, balance]))
}
