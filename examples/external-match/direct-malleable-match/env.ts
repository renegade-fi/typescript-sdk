import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const chainId = arbitrumSepolia.id;
const privateKeyRaw = process.env.PKEY;
if (!privateKeyRaw) {
    throw new Error("PKEY is not set");
}

// Ensure private key has 0x prefix
const privateKey = privateKeyRaw.startsWith("0x")
    ? (privateKeyRaw as `0x${string}`)
    : (`0x${privateKeyRaw}` as `0x${string}`);

const account = privateKeyToAccount(privateKey);
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
