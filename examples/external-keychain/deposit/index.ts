import { RenegadeClient } from "@renegade-fi/node";
import { parseUnits } from "viem";
import {
    chainId,
    publicClient,
    publicKey,
    signMessage,
    walletClient,
    walletSecrets,
} from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

const USDC = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
const USDC_DECIMALS = 6;
const amount = parseUnits("1", USDC_DECIMALS);

let wallet = await client.getBackOfQueueWallet();
console.log("Wallet before deposit", wallet.balances);

await client.executeDeposit({
    amount,
    mint: USDC,
    publicClient,
    walletClient,
});

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after deposit", wallet.balances);
