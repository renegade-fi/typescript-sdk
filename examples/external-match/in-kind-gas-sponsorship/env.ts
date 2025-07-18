import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const chainId = arbitrumSepolia.id;
const privateKey = process.env.PKEY;
if (!privateKey) {
    throw new Error("PKEY is not set");
}
const account = privateKeyToAccount(privateKey as `0x${string}`);
const owner = account.address;

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
});

const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
});

export { account, chainId, publicClient, walletClient, API_KEY, API_SECRET, owner };
