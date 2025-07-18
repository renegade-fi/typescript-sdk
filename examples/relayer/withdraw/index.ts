import { RenegadeClient } from "@renegade-fi/node";
import { account, chainId, owner } from "./env";

const seed = await account.signMessage({
    message: RenegadeClient.generateSeedMessage(chainId),
});

const client = RenegadeClient.new({
    chainId,
    seed,
});

const mint = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a"; // WETH

let wallet = await client.getBackOfQueueWallet();
console.log("Wallet before withdraw", wallet.balances);
const balance = wallet.balances.find((balance) => balance.mint === mint)?.amount ?? BigInt(0);

await client.executeWithdraw({
    amount: balance,
    mint,
    destinationAddr: owner,
});

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after withdraw", wallet.balances);
