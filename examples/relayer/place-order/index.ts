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
console.log("Wallet before place order", wallet.orders);

const WETH_ADDRESS = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";
const USDC_ADDRESS = "0xdf8d259c04020562717557f2b5a3cf28e92707d1";
const amount = BigInt(10000000000000000); // 0.01 WETH
const worstCasePrice = (4000 * 1.5 * 10 ** (6 - 18)).toString(); // For a buy order: maximum price of 6000 USDC per ETH
const minFillSize = amount; // Minimum fill size of 0.01 ETH
const side = "buy";

const order = {
    base: WETH_ADDRESS,
    quote: USDC_ADDRESS,
    side,
    amount,
    worstCasePrice,
    minFillSize,
} as const;

await client.placeOrder(order);

wallet = await client.getBackOfQueueWallet();

console.log("Wallet after place order", wallet.orders);
