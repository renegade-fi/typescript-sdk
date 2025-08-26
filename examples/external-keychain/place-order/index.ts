import { RenegadeClient } from "@renegade-fi/node";
import { parseEther } from "viem";
import { chainId, publicKey, signMessage, walletSecrets } from "./env.js";

const client = RenegadeClient.newWithExternalKeychain({
    chainId,
    publicKey,
    signMessage,
    walletSecrets,
});

const WETH = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";
const USDC = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
const amount = parseEther("0.001");
const side = "buy";

const order = {
    base: WETH,
    quote: USDC,
    side,
    amount,
} as const;

await client.placeOrder(order);

const wallet = await client.getBackOfQueueWallet();

console.log("Orders in wallet:", wallet.orders);
