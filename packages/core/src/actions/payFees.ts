import { getBackOfQueueWallet } from "./getBackOfQueueWallet.js"
import { getWalletId } from "./getWalletId.js"
import { waitForTaskCompletion } from "./waitForTaskCompletion.js"

import { postRelayerWithAuth } from "../utils/http.js"

import { PAY_FEES_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"

export type PayFeesParameters = {
    waitForCompletion?: boolean
}
export type PayFeesReturnType = Promise<void>

export async function payFees(
    config: Config,
    parameters: PayFeesParameters = {},
): PayFeesReturnType {
    const { getRelayerBaseUrl } = config
    const { waitForCompletion = true } = parameters
    const walletId = getWalletId(config)
    const wallet = await getBackOfQueueWallet(config)

    const logContext = {
        walletId,
        wallet,
    }

    try {
        const res = await postRelayerWithAuth(config, getRelayerBaseUrl(PAY_FEES_ROUTE(walletId)))
        if (res?.task_ids) {
            const tasks = res.task_ids.map((id: string) => {
                console.log(`task pay-fees(${id}): ${walletId}`, logContext)
                if (waitForCompletion) {
                    return waitForTaskCompletion(config, { id })
                }
                return Promise.resolve() // Return a resolved promise for cases where no waiting is needed
            })

            await Promise.all(tasks)
        }
    } catch (error) {
        console.error(`wallet id: ${walletId} pay fees failed`, {
            error,
            ...logContext,
        })
        throw error
    }
}
