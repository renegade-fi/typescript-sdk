export type Task = {
  id: string
  state: TaskState
  created_at: bigint
  task_info: TaskInfo
}

export type TaskState =
  | 'Queued'
  | 'Running'
  | 'Proving'
  | 'Proving Payment'
  | 'Submitting Tx'
  | 'Submitting Payment'
  | 'Finding Opening'
  | 'Updating Validity Proofs'
  | 'Completed'
  | 'Failed'

export enum UpdateType {
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
  PlaceOrder = 'PlaceOrder',
  CancelOrder = 'CancelOrder',
}

export enum TaskType {
  NewWallet = 'NewWallet',
  UpdateWallet = 'UpdateWallet',
  SettleMatch = 'SettleMatch',
  PayOfflineFee = 'PayOfflineFee',
}

export type TaskInfo =
  | {
      update_type: UpdateType.Deposit
      task_type: TaskType.UpdateWallet
      mint: `0x${string}`
      amount: bigint
    }
  | {
      update_type: UpdateType.Withdraw
      task_type: TaskType.UpdateWallet
      mint: `0x${string}`
      amount: bigint
    }
  | {
      update_type: UpdateType.PlaceOrder
      task_type: TaskType.UpdateWallet
      amount: bigint
      base: `0x${string}`
      quote: `0x${string}`
      side: 'Buy' | 'Sell'
    }
  | {
      update_type: UpdateType.CancelOrder
      task_type: TaskType.UpdateWallet
      amount: bigint
      base: `0x${string}`
      quote: `0x${string}`
      side: 'Buy' | 'Sell'
    }
  | {
      task_type: TaskType.SettleMatch
      base: `0x${string}`
      is_sell: boolean
      quote: `0x${string}`
      volume: bigint
    }
  | {
      task_type: TaskType.PayOfflineFee
      mint: `0x${string}`
      amount: bigint
      is_protocol: boolean
    }
  | {
      task_type: TaskType.NewWallet
    }
