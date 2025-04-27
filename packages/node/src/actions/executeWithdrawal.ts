import {
    type RenegadeConfig,
    type WithdrawParameters,
    type WithdrawReturnType,
    getWalletId,
    payFees,
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

    console.log(`Paying fees for wallet ${walletId}`);
    await payFees(config);

    console.log(
        `Initiating withdrawal of ${parameters.amount} ${parameters.mint} for wallet ${walletId}`,
    );
    const { taskId } = await withdraw(config, parameters);

    if (parameters.awaitTask) {
        await waitForTaskCompletionWs(config, { id: taskId });
        console.log(`Withdrawal completed for wallet ${walletId}`);
    }

    return { taskId };
}
