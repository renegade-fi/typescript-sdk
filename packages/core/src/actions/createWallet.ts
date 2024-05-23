import type { Hex } from 'viem'
import { CREATE_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'
import { postRelayerRaw } from '../utils/http.js'
import { getSkRoot } from './getSkRoot.js'
import { getWalletId } from './getWalletId.js'
import { waitForWalletIndexing } from './waitForWalletIndexing.js'

export type CreateWalletParameters = { seed?: Hex }

export type CreateWalletReturnType = ReturnType<typeof waitForWalletIndexing>

export async function createWallet(
  config: Config,
  parameters: CreateWalletParameters,
): CreateWalletReturnType {
  const { getRelayerBaseUrl, utils } = config
  const { seed } = parameters
  const skRoot = getSkRoot(config)
  const body = utils.create_wallet(skRoot)
  const headers = {
    'Content-Type': 'application/json',
  }

  const res = await postRelayerRaw(
    getRelayerBaseUrl(CREATE_WALLET_ROUTE),
    body,
    headers,
  )
  if (res.task_id) {
    config.setState({ ...config.state, status: 'creating wallet' })
    console.log(`task create-wallet(${res.taskId}): ${res.walletId}`, {
      status: 'creating wallet',
      walletId: res.wallet_id,
    })
    return waitForWalletIndexing(config, {
      isLookup: false,
      onComplete: (wallet) => {
        config.setState({
          ...config.state,
          id: wallet.id,
          status: 'in relayer',
        })
        console.log(
          `task create-wallet(${res.task_id}) completed: ${wallet.id}`,
          {
            status: 'in relayer',
            walletId: wallet.id,
          },
        )
      },
      onFailure: () => {
        const walletId = getWalletId(config, { seed })
        console.error(`wallet id: ${walletId} creating wallet failed`, {
          status: 'creating wallet',
          walletId,
        })
        config.setState({
          status: 'disconnected',
          id: undefined,
          seed: undefined,
        })
      },
    })
  }
  return Promise.reject(new BaseError('Failed to create wallet'))
}
