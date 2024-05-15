import { createPublicClient, defineChain, http } from 'viem'

const isDevelopment =
  process.env.RPC_URL?.includes('dev') ||
  process.env.NEXT_PUBLIC_RPC_URL?.includes('dev')

const rpcURL = process.env.RPC_URL
  ? `https://${process.env.RPC_URL}`
  : process.env.NEXT_PUBLIC_RPC_URL
    ? `https://${process.env.NEXT_PUBLIC_RPC_URL}`
    : `https://${isDevelopment ? 'dev' : ''}sequencer.renegade.fi`

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
      http: [rpcURL],
    },
    public: {
      http: [rpcURL],
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
