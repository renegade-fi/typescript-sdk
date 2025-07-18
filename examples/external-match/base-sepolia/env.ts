import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const chainId = baseSepolia.id;
const privateKey = process.env.PKEY;
if (!privateKey) {
    throw new Error("PKEY is not set");
}
const account = privateKeyToAccount(privateKey as `0x${string}`);
const owner = account.address;

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
});

export { account, API_KEY, API_SECRET, chainId, owner, publicClient, walletClient };
