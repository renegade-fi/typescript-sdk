import {
  CREATE_WALLET_ROUTE,
  type Config,
  postRelayerRaw,
} from '@renegade-fi/core'
import { BaseError } from 'viem'

// export type CreateWalletReturnType = ReturnType<typeof waitForWalletIndexing>
export type CreateWalletReturnType = string

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
  // const body = utils.create_wallet(seed)
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

  const res = await postRelayerRaw(
    getRelayerBaseUrl(CREATE_WALLET_ROUTE),
    body,
    headers,
  )
  if (res.task_id) {
    return res.task_id
  }
  // if (res.task_id) {
  //   config.setState((x) => ({ ...x, status: 'creating wallet' }))
  //   console.log(`task create-wallet(${res.task_id}): ${res.wallet_id}`, {
  //     status: 'creating wallet',
  //     walletId: res.wallet_id,
  //   })
  //   return waitForWalletIndexing(config, {
  //     isLookup: false,
  //     onComplete: (wallet) => {
  //       config.setState((x) => ({ ...x, status: 'in relayer' }))
  //       console.log(
  //         `task create-wallet(${res.task_id}) completed: ${wallet.id}`,
  //         {
  //           status: 'in relayer',
  //           walletId: wallet.id,
  //         },
  //       )
  //     },
  //     onFailure: () => {
  //       console.error(`wallet id: ${config.state.id} creating wallet failed`, {
  //         status: 'creating wallet',
  //         walletId: config.state.id,
  //       })
  //       config.setState({})
  //     },
  //   })
  // }
  return Promise.reject(new BaseError('Failed to create wallet'))
}
