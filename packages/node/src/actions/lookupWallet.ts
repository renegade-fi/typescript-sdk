import {
  FIND_WALLET_ROUTE,
  getSkRoot,
  getWalletId,
  postRelayerRaw,
  waitForTaskCompletion,
  type Config,
} from '@renegade-fi/core'
import { createPublicClient, http, parseAbiItem, type Hex } from 'viem'

export type LookupWalletParameters = { seed?: Hex }

export type LookupWalletReturnType = Promise<void>

export async function lookupWallet(
  config: Config,
  parameters: LookupWalletParameters = {},
): LookupWalletReturnType {
  const { seed } = parameters
  const { getRelayerBaseUrl, utils } = config
  const skRoot = getSkRoot(config, { seed })
  const body = utils.find_wallet(skRoot)
  const walletId = getWalletId(config)

  try {
    const res = await postRelayerRaw(getRelayerBaseUrl(FIND_WALLET_ROUTE), body)
    console.log(`task lookup-wallet(${res.task_id}): ${res.wallet_id}`)
    config.setState({ ...config.state, status: 'looking up' })
    await waitForTaskCompletion(config, { id: res.task_id })
  } catch (error) {
    console.error(`looking up wallet id: ${walletId} failed`, error)
    throw error
  }
}

export async function lookupWalletOnChain(config: Config) {
  try {
    const { utils } = config
    const skRoot = getSkRoot(config)
    const blinderShare = utils.derive_blinder_share(skRoot)

    const publicClient = createPublicClient({
      chain: config.getRenegadeChain(),
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
