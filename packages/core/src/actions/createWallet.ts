import { getSkRoot } from "./getSkRoot.js"
import { waitForTaskCompletion } from "./waitForTaskCompletion.js"

import { postRelayerRaw } from "../utils/http.js"

import { CREATE_WALLET_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"

export type CreateWalletParameters = {}

export type CreateWalletReturnType = Promise<{ taskId: string; walletId: string }>

export async function createWallet(
    config: Config,
    parameters: CreateWalletParameters = {},
): CreateWalletReturnType {
    const {} = parameters
    const { getRelayerBaseUrl, utils } = config
    const skRoot = getSkRoot(config)
    const body = utils.create_wallet(skRoot)
    const headers = {
        "Content-Type": "application/json",
    }

    const res = await postRelayerRaw(getRelayerBaseUrl(CREATE_WALLET_ROUTE), body, headers)
    if (res.task_id) {
        config.setState({ ...config.state, status: "creating wallet" })
        waitForTaskCompletion(config, { id: res.task_id }).then(() => {
            config.setState({ ...config.state, status: "in relayer" })
        })
    }
    return { walletId: res.wallet_id, taskId: res.task_id }
}
