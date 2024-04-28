import { getWalletFromRelayer } from "./getWalletFromRelayer.js"
import { getWalletId } from "./getWalletId.js"
import JSONBigInt from "json-bigint"
import { type Address, toHex } from "viem"

import { postRelayerWithAuth } from "../utils/http.js"

import { WALLET_ORDERS_ROUTE } from "../constants.js"
import { type Config } from "../createConfig.js"
import { Token } from "../types/token.js"

export type CreateOrderParameters = {
    id?: string
    base: Address
    quote: Address
    side: "buy" | "sell"
    amount: bigint
}

export type CreateOrderReturnType = Promise<{ taskId: string }>

export async function createOrder(
    config: Config,
    parameters: CreateOrderParameters,
): CreateOrderReturnType {
    const { id = "", base, quote, side, amount } = parameters
    const { getRelayerBaseUrl, utils } = config

    const walletId = getWalletId(config)
    const wallet = await getWalletFromRelayer(config)
    const body = utils.new_order(JSONBigInt.stringify(wallet), id, base, quote, side, toHex(amount))

    const logContext = {
        walletId,
        base,
        quote,
        side,
        amount,
        body: JSON.parse(body),
        wallet,
    }

    try {
        const res = await postRelayerWithAuth(
            config,
            getRelayerBaseUrl(WALLET_ORDERS_ROUTE(walletId)),
            body,
        )
        console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext)
        return { taskId: res.task_id }
    } catch (error) {
        console.error(
            `wallet id: ${walletId} creating order to ${side} ${amount} ${Token.findByAddress(base).ticker} failed`,
            {
                error,
                ...logContext,
            },
        )
        throw error
    }
}
