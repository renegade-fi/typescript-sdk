import { type Address, toHex } from 'viem'
import { WITHDRAW_BALANCE_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type WithdrawParameters = {
  mint: Address
  amount: bigint
  destinationAddr: Address
  newPublicKey?: string
}

export type WithdrawReturnType = Promise<{ taskId: string }>

export async function withdraw(
  config: RenegadeConfig,
  parameters: WithdrawParameters,
): WithdrawReturnType {
  const { mint, amount, destinationAddr, newPublicKey } = parameters
  const { getBaseUrl, utils, renegadeKeyType } = config

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const seed = renegadeKeyType === 'internal' ? config.state.seed : undefined
  const signMessage =
    renegadeKeyType === 'external' ? config.signMessage : undefined

  const body = await utils.withdraw(
    seed ?? '',
    stringifyForWasm(wallet),
    mint,
    toHex(amount),
    destinationAddr,
    newPublicKey,
    signMessage,
  )

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
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
