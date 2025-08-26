import { RenegadeClient } from "@renegade-fi/node";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

let wallet = await client.getBackOfQueueWallet();

console.log("Wallet before cancel order", wallet.orders);

const orderIds = wallet.orders.map((order) => order.id);

for (const id of orderIds) {
    await client.cancelOrder({ id });
}

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after cancel order", wallet.orders);
