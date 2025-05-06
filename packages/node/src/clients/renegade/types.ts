import type { SDKConfig } from "@renegade-fi/core";
import type { GeneratedSecrets } from "../../actions/generateWalletSecrets.js";

type CommonParams = {
    chainId: number;
    overrides?: Partial<SDKConfig>;
};

type SeedParams = CommonParams & {
    mode: "seed";
    seed: `0x${string}`;
};

type KeychainParams = CommonParams & {
    mode: "keychain";
    walletSecrets: GeneratedSecrets;
    signMessage: (message: string) => Promise<`0x${string}`>;
    publicKey: `0x${string}`;
};

export type ConstructorParams = SeedParams | KeychainParams;
