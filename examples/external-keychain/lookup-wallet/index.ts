import { RenegadeClient } from "@renegade-fi/node";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

await client.lookupWallet();

const wallet = await client.getWallet();
console.log("Balances:", wallet.balances);
