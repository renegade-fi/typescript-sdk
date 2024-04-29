import { getSkRoot } from "./getSkRoot.js"
import { getWalletFromRelayer } from "./getWalletFromRelayer.js"
import { waitForTaskCompletion } from "./waitForTaskCompletion.js"
import { type Hex, parseAbiItem } from "viem"

import { publicClient } from "../utils/chain.js"
import { postRelayerRaw } from "../utils/http.js"

import { FIND_WALLET_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"

export type LookupWalletParameters = { seed?: Hex }

export type LookupWalletReturnType = Promise<{ taskId: string; walletId: string }>

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
        config.setState({ ...config.state, status: "looking up" })
        waitForTaskCompletion(config, { id: res.task_id }).then(async () => {
            await getWalletFromRelayer(config, { seed }).then(wallet => {
                if (wallet) {
                    config.setState({ ...config.state, status: "in relayer", id: res.wallet_id })
                    console.log(`task lookup-wallet(${res.task_id}) completed: ${res.wallet_id}`, {
                        status: "in relayer",
                        walletId: res.wallet_id,
                    })
                }
            })
        })
    }
    return { taskId: res.task_id, walletId: res.wallet_id }
}

export async function lookupWalletOnChain(config: Config) {
    try {
        const { utils } = config
        const skRoot = getSkRoot(config)
        const blinderShare = utils.derive_blinder_share(skRoot)

        const logs = await publicClient.getLogs({
            address: config.darkPoolAddress,
            event: parseAbiItem("event WalletUpdated(uint256 indexed wallet_blinder_share)"),
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
