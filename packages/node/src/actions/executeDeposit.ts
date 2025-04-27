import {
    type DepositReturnType,
    type RenegadeConfig,
    deposit,
    getBackOfQueueWallet,
    getPkRootScalars,
    waitForTaskCompletionWs,
} from "@renegade-fi/core";
import { type createConfig, waitForTransactionReceipt } from "@wagmi/core";
import invariant from "tiny-invariant";
import { type Address, type WalletClient, erc20Abi, zeroAddress } from "viem";
import { signPermit2 } from "../utils/permit2.js";

export type ExecuteDepositParameters = {
    mint: Address;
    amount: bigint;
    permit2Address: Address;
    walletClient: WalletClient;
    viemConfig: ReturnType<typeof createConfig>;
    awaitTask?: boolean;
    newPublicKey?: string;
};

export async function executeDeposit(
    config: RenegadeConfig,
    parameters: ExecuteDepositParameters,
): DepositReturnType {
    const { mint, amount, permit2Address, walletClient, viemConfig, awaitTask, newPublicKey } =
        parameters;
    invariant(config.viemClient, "Viem client is required");
    const chainId = config.viemClient.chain?.id;

    if (mint === zeroAddress || mint === "0x") {
        throw new Error("Invalid mint address");
    }
    if (amount === BigInt(0)) {
        throw new Error("Amount must be greater than zero");
    }
    if (!chainId) {
        throw new Error("Invalid chainId");
    }
    if (!walletClient.account) {
        throw new Error("Invalid wallet client");
    }

    const keychainNonce = (await getBackOfQueueWallet(config)).key_chain.nonce;
    const pkRoot = getPkRootScalars(config, {
        nonce: keychainNonce,
    });

    // Check Permit2 Allowance
    const permit2Allowance = await config.viemClient.readContract({
        address: mint,
        abi: erc20Abi,
        functionName: "allowance",
        args: [walletClient.account.address, permit2Address],
    });

    // If not enough allowance, approve max amount
    if (permit2Allowance < amount) {
        const nonce = await config.viemClient.getTransactionCount({
            address: walletClient.account.address,
        });
        const { request } = await config.viemClient.simulateContract({
            account: walletClient.account,
            address: mint,
            abi: erc20Abi,
            functionName: "approve",
            args: [permit2Address, amount],
            nonce,
        });
        const hash = await walletClient.writeContract(request);
        await waitForTransactionReceipt(viemConfig, {
            hash,
            confirmations: 1,
            timeout: 5_000,
        }).catch(() => {
            // Attempt deposit even if receipt not found
        });
    }

    // Sign Permit2
    const { nonce, deadline, signature } = await signPermit2({
        amount,
        chainId,
        spender: config.darkPoolAddress,
        permit2Address,
        tokenAddress: mint,
        walletClient,
        pkRoot,
    });

    // Deposit
    const { taskId } = await deposit(config, {
        fromAddr: walletClient.account.address,
        mint,
        amount,
        permitNonce: nonce,
        permitDeadline: deadline,
        permit: signature,
        newPublicKey,
    });

    if (awaitTask) {
        await waitForTaskCompletionWs(config, {
            id: taskId,
            timeout: 30_000,
        });
    }

    return { taskId };
}
