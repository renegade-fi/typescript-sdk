import { createWallet } from "./createWallet.js"
import { getWalletFromRelayer } from "./getWalletFromRelayer.js"
import { getWalletId } from "./getWalletId.js"
import { lookupWallet, lookupWalletOnChain } from "./lookupWallet.js"
import type { Hex } from "viem"

import { type Config } from "../createConfig.js"

export type ConnectParameters = { seed?: Hex }

export type ConnectReturnType = Promise<{ taskId: string } | undefined>

export async function connect(
    config: Config,
    parameters: ConnectParameters = {},
): ConnectReturnType {
    const { seed } = parameters
    let walletId = config.state.id
    try {
        walletId = getWalletId(config, { seed })
    } catch (error: any) {
        console.error("Error getting wallet id", {
            errorStack: error.stack,
            errorMessage: error.message,
            walletId,
            seed,
        })
        throw error
    }

    console.log("Attempting to connect wallet", { walletId })

    try {
        const wallet = await getWalletFromRelayer(config, { seed })
        if (wallet) {
            config.setState({ ...config.state, status: "in relayer", id: wallet.id })
            console.log("Wallet found in relayer", {
                status: "in relayer",
                walletId: wallet.id,
            })
            return
        }
    } catch (error) {
        console.error("Error getting wallet from relayer", { error, walletId })
    }

    // If wallet on chain, start lookup wallet task
    const isOnChain = await lookupWalletOnChain(config)
    if (isOnChain) {
        try {
            const res = await lookupWallet(config, { seed })
            walletId = res.walletId
            console.log(`task lookup-wallet(${res.taskId}): ${res.walletId}`, {
                status: "looking up",
                walletId: res.walletId,
            })
            return { taskId: res.taskId }
        } catch (error) {
            console.error(`wallet id: ${walletId} looking up failed`, {
                error,
                status: "looking up",
                walletId,
            })
            config.setState({ status: "disconnected", id: undefined, seed: undefined })
            throw error
        }
    }

    // If wallet not in relayer or on chain, call createWallet
    try {
        const res = await createWallet(config)
        walletId = res.walletId
        console.log(`task create-wallet(${res.taskId}): ${res.walletId}`, {
            status: "creating wallet",
            walletId: res.walletId,
        })
        return { taskId: res.taskId }
    } catch (error) {
        console.error(`wallet id: ${walletId} creating wallet failed`, {
            error,
            status: "creating wallet",
            walletId,
        })
        config.setState({ status: "disconnected", id: undefined, seed: undefined })
        throw error
    }
}
