import type { Hex } from 'viem'
import type { Order } from './order.js'

export type Exchange = 'binance' | 'coinbase' | 'kraken' | 'okx'

export type NetworkOrder = {
  id: string
  public_share_nullifier: bigint[]
  local: boolean
  cluster: string
  state: string
  timestamp: bigint
}

export type Balance = {
  mint: `0x${string}`
  amount: bigint
  relayer_fee_balance: bigint
  protocol_fee_balance: bigint
}

export type KeyChain = {
  public_keys: {
    pk_root: Hex
    pk_match: Hex
  }
  private_keys: {
    sk_root: Hex
    sk_match: Hex
  }
  nonce: bigint
}

export type Wallet = {
  id: string
  orders: Order[]
  balances: Balance[]
  key_chain: KeyChain
  managing_cluster: Hex
  match_fee: bigint
  blinded_public_shares: bigint[][]
  private_shares: bigint[][]
  blinder: bigint[]
}

export type OldTask = {
  id: string
  description: string
  state: string
  committed: boolean
}
