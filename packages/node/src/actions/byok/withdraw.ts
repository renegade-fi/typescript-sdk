import {
  type BYOKConfig,
  Token,
  WITHDRAW_BALANCE_ROUTE,
  postWithSymmetricKey,
  stringifyForWasm,
} from '@renegade-fi/core'
import invariant from 'tiny-invariant'
import { type Address, toHex } from 'viem'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'

export type WithdrawParameters = {
  mint: Address
  amount: bigint
  destinationAddr: Address
  newPublicKey?: `0x${string}`
}

export type WithdrawReturnType = Promise<{ taskId: string }>

export async function withdraw(
  config: BYOKConfig,
  parameters: WithdrawParameters,
): WithdrawReturnType {
  const { mint, amount, destinationAddr, newPublicKey } = parameters
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

  const body = await utils.byok_withdraw(
    walletStr,
    signMessage,
    newPublicKey ?? publicKey,
    mint,
    toHex(amount),
    destinationAddr,
  )

  try {
    const res = await postWithSymmetricKey(config, {
      body,
      key: symmetricKey,
      url: getRelayerBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)),
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
