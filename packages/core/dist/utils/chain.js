import { defineChain } from 'viem';
export const devnetChain = defineChain({
    id: 473474,
    name: 'Renegade Devnet',
    network: 'Renegade Devnet',
    testnet: true,
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://dev.sequencer.renegade.fi'],
        },
        public: {
            http: ['https://dev.sequencer.renegade.fi'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: 'https://explorer.renegade.fi/',
        },
    },
});
export const testnetChain = defineChain({
    id: 473474,
    name: 'Renegade Testnet',
    network: 'Renegade Testnet',
    testnet: true,
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://sequencer.renegade.fi'],
        },
        public: {
            http: ['https://sequencer.renegade.fi'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: 'https://explorer.renegade.fi/',
        },
    },
});
export const chain = process.env.NEXT_PUBLIC_RPC_URL?.includes('dev')
    ? devnetChain
    : testnetChain;
//# sourceMappingURL=chain.js.map