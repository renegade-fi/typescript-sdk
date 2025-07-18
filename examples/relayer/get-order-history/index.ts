import { RenegadeClient } from "@renegade-fi/node";
import { account, chainId } from "./env";

const seed = await account.signMessage({
    message: RenegadeClient.generateSeedMessage(chainId),
});

const client = RenegadeClient.new({
    chainId,
    seed,
});

const orderHistory = await client.getOrderHistory();

console.log("Order history:", orderHistory);
