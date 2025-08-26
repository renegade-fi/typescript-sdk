import { RenegadeClient } from "@renegade-fi/node";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

const wallet = await client.getWallet();

console.log("Wallet ID:", `\n${wallet.id}`);
console.log("-".repeat(100));
console.log(
    "Wallet balances:",
    `\n${wallet.balances.map((balance) => `${balance.mint}: ${balance.amount}`).join("\n")}`,
);
console.log("-".repeat(100));
console.log(
    "Wallet orders:",
    `\n${wallet.orders
        .map((order) => `${order.side} ${order.amount} ${order.base_mint} for ${order.quote_mint}`)
        .join("\n")}`,
);
