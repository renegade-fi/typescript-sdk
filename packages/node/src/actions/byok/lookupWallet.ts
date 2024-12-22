import {
  type BYOKConfig,
  FIND_WALLET_ROUTE,
  postWithSymmetricKey,
} from '@renegade-fi/core'

export type LookupWalletParameters = {
  blinderSeed: string
  shareSeed: string
  publicKey: string
  skMatch: string
}

export type LookupWalletReturnType = Promise<{ taskId: string }>

export async function lookupWallet(
  config: BYOKConfig,
  parameters: LookupWalletParameters,
): LookupWalletReturnType {
  const { blinderSeed, shareSeed, publicKey, skMatch } = parameters
  const { getRelayerBaseUrl, utils, walletId, symmetricKey } = config

  const body = await utils.byok_find_wallet(
    walletId,
    blinderSeed,
    shareSeed,
    publicKey,
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
