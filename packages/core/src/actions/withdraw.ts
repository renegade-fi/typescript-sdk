import invariant from 'tiny-invariant'
import { type Address, toHex } from 'viem'
import { WITHDRAW_BALANCE_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

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
  const {
    getRelayerBaseUrl,
    utils,
    state: { seed },
  } = config
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

  try {
    const res = await postRelayerWithAuth(
      config,
      getRelayerBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
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
