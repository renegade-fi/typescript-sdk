import { createPublicClient, defineChain, http } from 'viem'

const isDevelopment =
  process.env.RPC_URL?.includes('dev') ||
  process.env.NEXT_PUBLIC_RPC_URL?.includes('dev')

export const chain = defineChain({
  id: 473474,
  name: isDevelopment ? 'Renegade Devnet' : 'Renegade Testnet',
  network: isDevelopment ? 'Renegade Devnet' : 'Renegade Testnet',
  testnet: true,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [
        isDevelopment
          ? 'https://dev.sequencer.renegade.fi'
          : 'https://sequencer.renegade.fi',
      ],
    },
    public: {
      http: [
        isDevelopment
          ? 'https://dev.sequencer.renegade.fi'
          : 'https://sequencer.renegade.fi',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://explorer.renegade.fi/',
    },
  },
})

export const viemClient = createPublicClient({
  chain,
  transport: http(),
})
