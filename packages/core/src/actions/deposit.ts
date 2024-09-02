import invariant from 'tiny-invariant'
import { type Address, toHex } from 'viem'
import { DEPOSIT_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType } from '../errors/base.js'
import { Token } from '../types/token.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type DepositParameters = {
  fromAddr: Address
  mint: Address
  amount: bigint
  permitNonce: bigint
  permitDeadline: bigint
  permit: `0x${string}`
}

export type DepositReturnType = Promise<{ taskId: string }>

export type DepositErrorType = BaseErrorType

export async function deposit(
  config: Config,
  parameters: DepositParameters,
): DepositReturnType {
  const { fromAddr, mint, amount, permitNonce, permitDeadline, permit } =
    parameters
  const { getRelayerBaseUrl, utils, state: { seed } } = config
  invariant(seed, 'Seed is required')

  const token = Token.findByAddress(mint)
  invariant(token, 'Token not found')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)
  const walletStr = stringifyForWasm(wallet)


  const body = utils.deposit(
    seed,
    walletStr,
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
    console.error(
      `${walletId}`,
      {
        error,
      },
    )
    throw error
  }
}
