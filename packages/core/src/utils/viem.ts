import { createPublicClient, defineChain, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const rpcURL = process.env.RPC_URL
  ? `https://${process.env.RPC_URL}`
  : process.env.NEXT_PUBLIC_RPC_URL
    ? `https://${process.env.NEXT_PUBLIC_RPC_URL}`
    : 'https://dev.sequencer.renegade.fi'

const chainId = process.env.CHAIN_ID
  ? process.env.CHAIN_ID
  : process.env.NEXT_PUBLIC_CHAIN_ID
    ? process.env.NEXT_PUBLIC_CHAIN_ID
    : 473474

const renegadeDevnet = defineChain({
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
      http: [rpcURL],
    },
  },
})

export const chain =
  Number(chainId) === 421_614 ? arbitrumSepolia : renegadeDevnet

export const viemClient = createPublicClient({
  chain,
  transport: http(),
})
