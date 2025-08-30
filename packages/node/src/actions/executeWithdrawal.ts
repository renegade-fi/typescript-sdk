import {
    getWalletId,
    payFees,
    type RenegadeConfig,
    type WithdrawParameters,
    type WithdrawReturnType,
    waitForTaskCompletionWs,
    withdraw,
} from "@renegade-fi/core";

export type ExecuteWithdrawalParameters = WithdrawParameters & {
    awaitTask?: boolean;
};

export async function executeWithdrawal(
    config: RenegadeConfig,
    parameters: ExecuteWithdrawalParameters,
): WithdrawReturnType {
    const walletId = getWalletId(config);
    const logger = config.getLogger("node:actions:executeWithdrawal");

    logger.debug("Paying fees", { walletId });
    await payFees(config);

    logger.debug("Initiating withdrawal", {
        walletId,
        mint: parameters.mint,
        amount: parameters.amount,
    });
    const { taskId } = await withdraw(config, parameters);

    if (parameters.awaitTask) {
        await waitForTaskCompletionWs(config, { id: taskId });
        logger.debug("Withdrawal completed", { walletId, taskId });
    }

    return { taskId };
}
