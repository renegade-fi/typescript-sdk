import { createPublicClient, http, parseAbiItem, type Hex } from 'viem'
import { FIND_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { postRelayerRaw } from '../utils/http.js'
import { chain } from '../utils/viem.js'
import { getSkRoot } from './getSkRoot.js'
import { waitForWalletIndexing } from './waitForWalletIndexing.js'
import { BaseError } from '../errors/base.js'
import { getWalletId } from './getWalletId.js'

export type LookupWalletParameters = { seed?: Hex }

export type LookupWalletReturnType = ReturnType<typeof waitForWalletIndexing>

export async function lookupWallet(
  config: Config,
  parameters: LookupWalletParameters = {},
): LookupWalletReturnType {
  const { seed } = parameters
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config, { seed })
  const body = utils.find_wallet(skRoot)
  const res = await postRelayerRaw(getRelayerBaseUrl(FIND_WALLET_ROUTE), body)
  if (res.task_id) {
    console.log(`task lookup-wallet(${res.taskId}): ${res.walletId}`, {
      status: 'looking up',
      walletId: res.wallet_id,
    })
    config.setState({ ...config.state, status: 'looking up' })
    return waitForWalletIndexing(config, {
      isLookup: true,
      onComplete(wallet) {
        config.setState({
          ...config.state,
          status: 'in relayer',
          id: wallet.id,
        })
        console.log(
          `task lookup-wallet(${res.task_id}) completed: ${wallet.id}`,
          {
            status: 'in relayer',
            walletId: wallet.id,
          },
        )
      },
      onFailure() {
        const walletId = getWalletId(config, { seed })
        console.error(`wallet id: ${walletId} looking up failed`, {
          status: 'looking up',
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
  return Promise.reject(new BaseError('Failed to lookup wallet'))
}

export async function lookupWalletOnChain(config: Config) {
  try {
    const { utils } = config
    const skRoot = getSkRoot(config)
    const blinderShare = utils.derive_blinder_share(skRoot)

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })

    const logs = await publicClient.getLogs({
      address: config.darkPoolAddress,
      event: parseAbiItem(
        'event WalletUpdated(uint256 indexed wallet_blinder_share)',
      ),
      args: {
        wallet_blinder_share: blinderShare,
      },
      fromBlock: 0n,
    })
    return logs.length > 0
  } catch (error) {
    console.error(`Error looking up wallet on chain: ${error}`)
    throw error
  }
}
