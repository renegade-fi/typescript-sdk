import { FIND_WALLET_ROUTE, postWithSymmetricKey } from '@renegade-fi/core'
import type { BYOKConfig } from '../../utils/createBYOKConfig.js'

export type LookupWalletParameters = {
  walletId: string
  blinderSeed: string
  shareSeed: string
  pkRoot: string
  skMatch: string
  symmetricKey: string
}

export type LookupWalletReturnType = Promise<{ taskId: string }>

export async function lookupWallet(
  config: BYOKConfig,
  parameters: LookupWalletParameters,
): LookupWalletReturnType {
  const { walletId, blinderSeed, shareSeed, pkRoot, skMatch, symmetricKey } =
    parameters
  const { getRelayerBaseUrl, utils } = config

  const body = await utils.byok_find_wallet(
    walletId,
    blinderSeed,
    shareSeed,
    pkRoot,
    skMatch,
    symmetricKey,
  )

  try {
    const res = await postWithSymmetricKey(config, {
      body,
      key: symmetricKey,
      url: getRelayerBaseUrl(FIND_WALLET_ROUTE),
    })
    console.log(`task lookup-wallet(${res.task_id}): ${walletId}`)
    return { taskId: res.task_id }
  } catch (error) {
    console.error(`${walletId}`, {
      error,
    })
    throw error
  }
}
