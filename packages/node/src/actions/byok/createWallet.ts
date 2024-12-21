import {
  CREATE_WALLET_ROUTE,
  type Config,
  postRelayerRaw,
} from '@renegade-fi/core'

export type CreateWalletReturnType = { taskId: string }

export type CreateWalletParameters = {
  walletId: string
  blinderSeed: string
  shareSeed: string
  pkRoot: string
  skMatch: string
  symmetricKey: string
}

export async function createWallet(
  config: Config,
  parameters: CreateWalletParameters,
): Promise<CreateWalletReturnType> {
  const { walletId, blinderSeed, shareSeed, pkRoot, skMatch, symmetricKey } =
    parameters
  const { getRelayerBaseUrl, utils } = config
  const body = await utils.byok_create_wallet(
    walletId,
    blinderSeed,
    shareSeed,
    pkRoot,
    skMatch,
    symmetricKey,
  )
  const headers = {
    'Content-Type': 'application/json',
  }

  try {
    const res = await postRelayerRaw(
      getRelayerBaseUrl(CREATE_WALLET_ROUTE),
      body,
      headers,
    )
    return { taskId: res.task_id }
  } catch (error) {
    console.error('Failed to create wallet', {
      error,
    })
    throw error
  }
}
