import { Token } from "@renegade-fi/token";
import { chainId } from "./env";
import remap from "./remap.json";

Token.addRemapFromString(chainId, JSON.stringify(remap));
const WETH = Token.fromTicker("WETH");
const WETH_ADDRESS = WETH.address;
console.log(`WETH ADDRESS on Chain ${chainId} is ${WETH_ADDRESS}`);
