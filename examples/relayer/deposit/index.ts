import { RenegadeClient } from "@renegade-fi/node";
import { account, chainId, publicClient, walletClient } from "./env";

const seed = await account.signMessage({
    message: RenegadeClient.generateSeedMessage(chainId),
});

const client = RenegadeClient.new({
    chainId,
    seed,
});

const mint = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a"; // WETH
const amount = BigInt(10000000000000000); // 0.01 WETH

let wallet = await client.getBackOfQueueWallet();
console.log("Wallet before deposit", wallet.balances);

await client.executeDeposit({
    amount,
    mint,
    publicClient,
    walletClient,
});

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after deposit", wallet.balances);
