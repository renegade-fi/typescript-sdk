import invariant from 'tiny-invariant'
import { parseAbiItem } from 'viem'
import { FIND_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'
import { postRelayerRaw } from '../utils/http.js'
import { waitForWalletIndexing } from './waitForWalletIndexing.js'

export type LookupWalletReturnType = ReturnType<typeof waitForWalletIndexing>

export async function lookupWallet(config: Config): LookupWalletReturnType {
  const {
    getRelayerBaseUrl,
    utils,
    state: { seed },
  } = config
  invariant(seed, 'seed is required')
  const body = utils.find_wallet(seed)
  const res = await postRelayerRaw(getRelayerBaseUrl(FIND_WALLET_ROUTE), body)
  if (res.task_id) {
    console.log(`task lookup-wallet(${res.task_id}): ${res.wallet_id}`, {
      status: 'looking up',
      walletId: res.wallet_id,
    })
    config.setState((x) => ({ ...x, status: 'looking up' }))
    return waitForWalletIndexing(config, {
      timeout: 300000,
      isLookup: true,
      onComplete(wallet) {
        config.setState((x) => ({
          ...x,
          status: 'in relayer',
        }))
        console.log(
          `task lookup-wallet(${res.task_id}) completed: ${wallet.id}`,
          {
            status: 'in relayer',
            walletId: wallet.id,
          },
        )
      },
      onFailure() {
        console.error(`wallet id: ${config.state.id} looking up failed`, {
          status: 'looking up',
          walletId: config.state.id,
        })
        config.setState({})
      },
    })
  }
  return Promise.reject(new BaseError('Failed to lookup wallet'))
}

// Returns true iff the query successfully returns 0 logs
export async function checkForWalletUpdatesOnChain(config: Config) {
  try {
    const {
      utils,
      state: { seed },
    } = config
    invariant(seed, 'Seed is required')
    const blinderShare = utils.derive_blinder_share(seed)

    const logs = await config.viemClient.getLogs({
      address: config.darkPoolAddress,
      event: parseAbiItem(
        'event WalletUpdated(uint256 indexed wallet_blinder_share)',
      ),
      args: {
        wallet_blinder_share: blinderShare,
      },
      fromBlock: BigInt(
        process.env.FROM_BLOCK || process.env.NEXT_PUBLIC_FROM_BLOCK || 0,
      ),
    })
    return logs.length === 0
  } catch (error) {
    console.error(`Error looking up wallet on chain: ${error}`)
    return false
  }
}
