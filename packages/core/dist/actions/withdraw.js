import { getWalletFromRelayer } from "./getWalletFromRelayer.js";
import { getWalletId } from "./getWalletId.js";
import JSONBigInt from "json-bigint";
import { toHex } from "viem";
import { postRelayerWithAuth } from "../utils/http.js";
import { WITHDRAW_BALANCE_ROUTE } from "../constants.js";
import {} from "../createConfig.js";
import { Token } from "../types/token.js";
export async function withdraw(config, parameters) {
    const { mint, amount, destinationAddr } = parameters;
    const { getRelayerBaseUrl, utils } = config;
    const walletId = getWalletId(config);
    const wallet = await getWalletFromRelayer(config);
    const body = utils.withdraw(JSONBigInt.stringify(wallet), mint, toHex(amount), destinationAddr);
    const logContext = {
        walletId,
        mint,
        ticker: Token.findByAddress(mint).ticker,
        amount,
        destinationAddr,
        body: JSON.parse(body),
        wallet,
    };
    try {
        const res = await postRelayerWithAuth(config, getRelayerBaseUrl(WITHDRAW_BALANCE_ROUTE(walletId, mint)), body);
        console.log(`task update-wallet(${res.task_id}): ${walletId}`, logContext);
        return { taskId: res.task_id };
    }
    catch (error) {
        console.error(`wallet id: ${walletId} withdrawing ${amount} ${Token.findByAddress(mint).ticker} failed`, {
            error,
            ...logContext,
        });
        throw error;
    }
}
//# sourceMappingURL=withdraw.js.map