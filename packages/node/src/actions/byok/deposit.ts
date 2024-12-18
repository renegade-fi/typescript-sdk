import {
  type Config,
  DEPOSIT_BALANCE_ROUTE,
  Token,
  getBackOfQueueWallet,
  getWalletId,
  postRelayerWithAuth,
  stringifyForWasm,
} from '@renegade-fi/core'
import invariant from 'tiny-invariant'
import {
  type Address,
  type BaseErrorType,
  type SignMessageReturnType,
  toHex,
} from 'viem'

export type DepositParameters = {
  fromAddr: Address
  mint: Address
  amount: bigint
  permitNonce: bigint
  permitDeadline: bigint
  permit: `0x${string}`
  signMessage: (message: string) => Promise<SignMessageReturnType>
}

export type DepositReturnType = Promise<{ taskId: string }>

export type DepositErrorType = BaseErrorType

export async function deposit(
  config: Config,
  parameters: DepositParameters,
): DepositReturnType {
  const {
    fromAddr,
    mint,
    amount,
    permitNonce,
    permitDeadline,
    permit,
    // TODO: Move to config
    signMessage,
  } = parameters
  const {
    getRelayerBaseUrl,
    utils,
    state: { seed },
  } = config
  invariant(seed, 'Seed is required')

  const token = Token.findByAddress(mint)
  invariant(token, 'Token not found')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)
  const walletStr = stringifyForWasm(wallet)

  const body = await utils.byok_deposit(
    seed,
    walletStr,
    signMessage,
    fromAddr,
    mint,
    toHex(amount),
    toHex(permitNonce),
    toHex(permitDeadline),
    permit,
  )

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
