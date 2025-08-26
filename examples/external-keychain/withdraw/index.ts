import { RenegadeClient } from "@renegade-fi/node";
import { address, chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

const WETH = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";

let wallet = await client.getBackOfQueueWallet();
console.log("Wallet before withdraw", wallet.balances);
const balance = wallet.balances.find((balance) => balance.mint === WETH)?.amount ?? BigInt(0);

await client.executeWithdraw({
    amount: balance,
    mint: WETH,
    destinationAddr: address,
});

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after withdraw", wallet.balances);
