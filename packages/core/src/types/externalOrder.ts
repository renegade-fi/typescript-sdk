import type { AccessList } from 'viem'
import type { FeeTake } from './match.js'

export type ExternalMatchResult = {
  quote_mint: `0x${string}`
  base_mint: `0x${string}`
  direction: 'Buy' | 'Sell'
  quote_amount: bigint
  base_amount: bigint
  min_fill_size: bigint
}

export type ExternalSettlementTx = {
  type: `0x${string}`
  to: `0x${string}`
  data: `0x${string}`
  accessList: AccessList
  gas?: `0x${string}`
}

export type ExternalMatchBundle = {
  match_result: ExternalMatchResult
  settlement_tx: ExternalSettlementTx
  receive: ExternalAssetTransfer
  send: ExternalAssetTransfer
  fees: FeeTake
}

export type ExternalAssetTransfer = {
  mint: `0x${string}`
  amount: bigint
}
