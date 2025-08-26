import * as secp from "@noble/secp256k1";
import { RenegadeClient } from "@renegade-fi/node";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { concatHex, keccak256, numberToHex } from "viem/utils";

const privateKey = "0xf22f37f6c5fd89a34c9346e7701b60a385c8c7f485537ba53253e5971a49303c"; // test account
const account = privateKeyToAccount(privateKey);
const address = account.address;
const publicKey = account.publicKey;

const chain = arbitrumSepolia;
const chainId = chain.id;
const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
});

const publicClient = createPublicClient({
    chain,
    transport: http(),
});

const signMessage = async (message: string) => {
    // Hash the raw message (do not add Ethereum message prefix)
    const hashedMessage = keccak256(message as `0x${string}`);

    // Sign the hash with your private key
    const sig = await secp.signAsync(hashedMessage.slice(2), privateKey.slice(2), {
        lowS: true,
        extraEntropy: false,
    });

    // Format signature as r[32] || s[32] || v[1]
    return concatHex([
        numberToHex(sig.r, { size: 32 }), // r component
        numberToHex(sig.s, { size: 32 }), // s component
        numberToHex(sig.recovery ? 1 : 0, { size: 1 }), // recovery bit
    ]);
};

const walletSecrets = await RenegadeClient.generateKeychain({
    sign: signMessage,
});

export {
    address,
    chainId,
    privateKey,
    publicClient,
    publicKey,
    signMessage,
    walletClient,
    walletSecrets,
};
