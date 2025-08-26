import { RenegadeClient } from "@renegade-fi/node";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

await client.createWallet();

const wallet = await client.getBackOfQueueWallet();

console.log("Wallet ID:", wallet.id);
