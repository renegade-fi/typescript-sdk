import {
  CREATE_WALLET_ROUTE,
  getSkRoot,
  postRelayerRaw,
  waitForTaskCompletion,
  type Config,
} from '@renegade-fi/core'

export type CreateWalletReturnType = Promise<void>

export async function createWallet(config: Config): CreateWalletReturnType {
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config)
  const body = utils.create_wallet(skRoot)

  try {
    const res = await postRelayerRaw(
      getRelayerBaseUrl(CREATE_WALLET_ROUTE),
      body,
    )
    console.log(`task create-wallet: ${res.task_id}`)
    await waitForTaskCompletion(config, { id: res.task_id })
  } catch (error) {
    console.error('create wallet failed', { error })
    throw error
  }
}
