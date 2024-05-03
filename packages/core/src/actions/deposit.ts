import JSONBigInt from 'json-bigint'
import invariant from 'tiny-invariant'
import { type Address, toHex } from 'viem'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { DEPOSIT_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { Token } from '../types/token.js'

export type DepositParameters = {
  fromAddr: Address
  mint: Address
  amount: bigint
  permitNonce: bigint
  permitDeadline: bigint
  permit: `0x${string}`
}

export type DepositReturnType = Promise<{ taskId: string }>

export async function deposit(
  config: Config,
  parameters: DepositParameters,
): DepositReturnType {
  const { fromAddr, mint, amount, permitNonce, permitDeadline, permit } =
    parameters
  const { getRelayerBaseUrl, utils } = config

  const token = Token.findByAddress(mint)
  invariant(token, 'Token not found')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)
  const body = utils.deposit(
    JSONBigInt.stringify(wallet),
    fromAddr,
    mint,
    toHex(amount),
    toHex(permitNonce),
    toHex(permitDeadline),
    permit,
  )

  const logContext = {
    walletId,
    mint,
    amount,
    permitNonce,
    permitDeadline,
    permit,
    body: JSON.parse(body),
    wallet,
  }

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(
      `wallet id: ${walletId} depositing ${amount} ${
        Token.findByAddress(mint).ticker
      } failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
