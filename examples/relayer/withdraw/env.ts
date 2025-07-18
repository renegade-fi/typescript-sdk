import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const chainId = arbitrumSepolia.id;
const privateKey = "0xf22f37f6c5fd89a34c9346e7701b60a385c8c7f485537ba53253e5971a49303c"; // test account
const account = privateKeyToAccount(privateKey);
const owner = account.address;

export { account, chainId, owner };
