import { CREATE_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'
import { postRelayerRaw } from '../utils/http.js'
import { getSkRoot } from './getSkRoot.js'
import { waitForWalletIndexing } from './waitForWalletIndexing.js'

export type CreateWalletReturnType = ReturnType<typeof waitForWalletIndexing>

export async function createWallet(config: Config): CreateWalletReturnType {
  const { getRelayerBaseUrl, utils } = config
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
    config.setState((x) => ({ ...x, status: 'creating wallet' }))
    console.log(`task create-wallet(${res.task_id}): ${res.wallet_id}`, {
      status: 'creating wallet',
      walletId: res.wallet_id,
    })
    return waitForWalletIndexing(config, {
      isLookup: false,
      onComplete: (wallet) => {
        config.setState((x) => ({ ...x, status: 'in relayer' }))
        console.log(
          `task create-wallet(${res.task_id}) completed: ${wallet.id}`,
          {
            status: 'in relayer',
            walletId: wallet.id,
          },
        )
      },
      onFailure: () => {
        console.error(`wallet id: ${config.state.id} creating wallet failed`, {
          status: 'creating wallet',
          walletId: config.state.id,
        })
        config.setState({})
      },
    })
  }
  return Promise.reject(new BaseError('Failed to create wallet'))
}
