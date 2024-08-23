import { type Address, toHex } from 'viem'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

import { postRelayerWithAuth } from '../utils/http.js'

import { WITHDRAW_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { Token } from '../types/token.js'
import { parseBigJSON, stringifyForWasm } from '../utils/bigJSON.js'
import invariant from 'tiny-invariant'

export type WithdrawParameters = {
  mint: Address
  amount: bigint
  destinationAddr: Address
}

export type WithdrawReturnType = Promise<{ taskId: string }>

export async function withdraw(
  config: Config,
  parameters: WithdrawParameters,
): WithdrawReturnType {
  const { mint, amount, destinationAddr } = parameters
  const { getRelayerBaseUrl, utils, state: { seed } } = config
  invariant(seed, 'Seed is required')

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  // Withdraw
  const body = utils.withdraw(
    seed,
    stringifyForWasm(wallet),
    mint,
    toHex(amount),
    destinationAddr,
  )

  const logContext = {
    walletId,
    mint,
    ticker: Token.findByAddress(mint).ticker,
    amount,
    destinationAddr,
    body: parseBigJSON(body),
    wallet,
  }

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
      body,
    )
    console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(
      `wallet id: ${walletId} withdrawing ${amount} ${Token.findByAddress(mint).ticker
      } failed`,
      {
        error,
        ...logContext,
      },
    )
    throw error
  }
}
