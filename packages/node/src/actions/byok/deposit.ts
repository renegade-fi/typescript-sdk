import {
  DEPOSIT_BALANCE_ROUTE,
  Token,
  postWithSymmetricKey,
  stringifyForWasm,
} from '@renegade-fi/core'
import invariant from 'tiny-invariant'
import { type Address, type BaseErrorType, toHex } from 'viem'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'

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
  config: BYOKConfig,
  parameters: DepositParameters,
): DepositReturnType {
  const { fromAddr, mint, amount, permitNonce, permitDeadline, permit } =
    parameters
  const {
    signMessage,
    symmetricKey,
    walletId,
    publicKey,
    getRelayerBaseUrl,
    utils,
  } = config

  const token = Token.findByAddress(mint)
  invariant(token, 'Token not found')

  const wallet = await getBackOfQueueWallet(config, {
    symmetricKey,
    walletId,
  })
  const walletStr = stringifyForWasm(wallet)

  const body = await utils.byok_deposit(
    walletStr,
    signMessage,
    publicKey,
    fromAddr,
    mint,
    toHex(amount),
    toHex(permitNonce),
    toHex(permitDeadline),
    permit,
  )

  try {
    const res = await postWithSymmetricKey(config, {
      body,
      key: symmetricKey,
      url: getRelayerBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
    })
    console.log(`task update-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
