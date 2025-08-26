import { RenegadeClient } from "@renegade-fi/node";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

const orderHistory = await client.getOrderHistory({ limit: 10 });

console.log("Order history:", orderHistory);
