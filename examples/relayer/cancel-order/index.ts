import { RenegadeClient } from "@renegade-fi/node";
import { account, chainId } from "./env";

const seed = await account.signMessage({
    message: RenegadeClient.generateSeedMessage(chainId),
});

const client = RenegadeClient.new({
    chainId,
    seed,
});

let wallet = await client.getBackOfQueueWallet();

console.log("Wallet before cancel order", wallet.orders);

const orderIds = wallet.orders.map((order) => order.id);

for (const id of orderIds) {
    await client.cancelOrder({ id });
}

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after cancel order", wallet.orders);
