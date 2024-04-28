import { createPublicClient, defineChain, http } from "viem"

export const chain = defineChain({
    id: 473474,
    name: "Renegade Testnet",
    network: "Renegade Testnet",
    testnet: true,
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["https://sequencer.renegade.fi/"],
        },
        public: {
            http: ["https://sequencer.renegade.fi/"],
        },
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://explorer.renegade.fi/",
        },
    },
})

export const publicClient = createPublicClient({
    chain,
    transport: http(),
})
