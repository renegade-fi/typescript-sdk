import invariant from 'tiny-invariant'
import { type Address, toHex } from 'viem'
import { DEPOSIT_BALANCE_ROUTE } from '../constants.js'
import type { RenegadeConfig } from '../createConfig.js'
import { stringifyForWasm } from '../utils/bigJSON.js'
import { postRelayerWithAuth } from '../utils/http.js'
import { getBackOfQueueWallet } from './getBackOfQueueWallet.js'
import { getWalletId } from './getWalletId.js'

export type DepositParameters = {
  amount: bigint
  fromAddr: Address
  mint: Address
  newPublicKey?: string
  permit: string
  permitDeadline: bigint
  permitNonce: bigint
}

export type DepositReturnType = Promise<{ taskId: string }>

export async function deposit(
  config: RenegadeConfig,
  parameters: DepositParameters,
): DepositReturnType {
  const {
    amount,
    fromAddr,
    mint,
    newPublicKey,
    permit,
    permitDeadline,
    permitNonce,
  } = parameters

  const { getBaseUrl, utils, renegadeKeyType } = config

  const walletId = getWalletId(config)
  const wallet = await getBackOfQueueWallet(config)

  const seed = renegadeKeyType === 'internal' ? config.state.seed : undefined
  const signMessage =
    renegadeKeyType === 'external' ? config.signMessage : undefined

  if (renegadeKeyType === 'external') {
    invariant(
      signMessage !== undefined,
      'Sign message function is required for external key type',
    )
  }
  if (renegadeKeyType === 'internal') {
    invariant(seed !== undefined, 'Seed is required for internal key type')
  }

  const body = await utils.deposit(
    // TODO: Change Rust to accept Option<String>
    seed,
    stringifyForWasm(wallet),
    fromAddr,
    mint,
    toHex(amount),
    toHex(permitNonce),
    toHex(permitDeadline),
    permit,
    newPublicKey,
    signMessage,
  )

  try {
    const res = await postRelayerWithAuth(
      config,
      getBaseUrl(DEPOSIT_BALANCE_ROUTE(walletId)),
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
