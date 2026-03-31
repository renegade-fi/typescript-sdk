// Constants for v2 relayer server URLs
const ARBITRUM_SEPOLIA_RELAYER_BASE_URL = "https://arbitrum-sepolia.v2.relayer.renegade.fi";
const ARBITRUM_ONE_BASERELAYER__URL     = "https://arbitrum-one.v2.relayer.renegade.fi";
const BASE_SEPOLIA_BASERELAYER__URL     = "https://base-sepolia.v2.relayer.renegade.fi";
const BASE_MAINNET_BASERELAYER__URL     = "https://base-mainnet.v2.relayer.renegade.fi";

// The Arbitrum one chain ID
const ARBITRUM_ONE_CHAIN_ID = 42161;
// The Arbitrum Sepolia chain ID
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
// The Base mainnet chain ID
const BASE_MAINNET_CHAIN_ID = 8453;
// The Base Sepolia chain ID
const BASE_SEPOLIA_CHAIN_ID = 84532;
// The Ethereum Sepolia chain ID
const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

import { type HttpResponse, RelayerHttpClient } from "@renegade-fi/http-client";

/**
 * Client for interacting with the Renegade direct match API.
 */
export class DirectMatchClient {
    /**
     * Initialize a new DirectMatchClient.
     *
     * @param baseUrl The base URL of the relayer server API
     */
    constructor(baseUrl: string) {
        this.httpClient = new RelayerHttpClient(baseUrl);
    }
}
