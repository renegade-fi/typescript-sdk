import { Token } from "@renegade-fi/token";
import { chainId } from "./env";

await Token.fetchRemapFromRepo(chainId);
const WETH = Token.fromTicker("WETH");
const WETH_ADDRESS = WETH.address;
console.log(`WETH ADDRESS on Chain ${chainId} is ${WETH_ADDRESS}`);
