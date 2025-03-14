import {
  type AuthConfig,
  type GetExternalMatchQuoteReturnType,
  Token,
} from '@renegade-fi/core'
import { createAuthConfig, loadTokenMapping } from '@renegade-fi/node'
// Then do the imports
import { http, createWalletClient, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import {
  assembleExternalQuote,
  getExternalMatchQuote,
} from '../../packages/core/src/exports/actions'
import type { ExternalMatchResponse } from '../../packages/core/src/types/externalMatch'

// -------------------------
// | Environment Variables |
// -------------------------

// Get API credentials from environment variables
const apiKey = process.env.EXTERNAL_MATCH_KEY
const apiSecret = process.env.EXTERNAL_MATCH_SECRET
const authServerUrl = 'https://testnet.auth-server.renegade.fi'
const rpcUrl = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
const refundAddress = '0x99D9133afE1B9eC1726C077cA2b79Dcbb5969707'

if (!apiKey || !apiSecret) {
  throw new Error(
    'Missing required environment variables: EXTERNAL_MATCH_KEY and/or EXTERNAL_MATCH_SECRET',
  )
}

if (!process.env.PKEY) {
  throw new Error('PKEY environment variable not set')
}

const pkey = process.env.PKEY.startsWith('0x')
  ? process.env.PKEY
  : `0x${process.env.PKEY}`
const walletClient = createWalletClient({
  account: privateKeyToAccount(pkey as `0x${string}`),
  chain: arbitrumSepolia,
  transport: http(rpcUrl),
})

// -------------------------
// | Quote + Assemble Flow |
// -------------------------

/**
 * Get a quote for the order
 * @param config The auth config
 * @returns The quote from the relayer
 */
async function getQuote(
  config: AuthConfig,
): Promise<GetExternalMatchQuoteReturnType> {
  console.log('Getting quote...')
  const baseToken = Token.findByTicker('WETH')
  const quoteToken = Token.findByTicker('USDC')

  return await getExternalMatchQuote(config, {
    useGasSponsorship: true, // Note that this is true by default
    refundAddress: refundAddress,
    refundNativeEth: true,
    order: {
      base: baseToken.address,
      quote: quoteToken.address,
      side: 'sell',
      quoteAmount: BigInt(2000000000),
      minFillSize: BigInt(2),
    },
  })
}

/**
 * Assemble the quote into a bundle that can be submitted on-chain
 * @param quote The quote from the relayer
 * @param config The auth config
 * @returns The assembled bundle
 */
async function assembleQuote(
  quote: GetExternalMatchQuoteReturnType,
  config: AuthConfig,
): Promise<ExternalMatchResponse> {
  console.log('Assembling quote...')
  const baseToken = Token.findByTicker('WETH')
  const quoteToken = Token.findByTicker('USDC')
  return await assembleExternalQuote(config, {
    quote,
    updatedOrder: {
      base: baseToken.address,
      quote: quoteToken.address,
      side: 'sell',
      quoteAmount: BigInt(20_000_000) /* $20 */,
      minFillSize: BigInt(20),
    },
  })
}

/**
 * Submit a transaction to the chain
 * @param settlementTx The settlement transaction
 * @returns The submitted transaction
 */
async function submitTransaction(settlementTx: any) {
  console.log('Submitting transaction...')
  const tx = await walletClient.sendTransaction({
    to: settlementTx.to,
    data: settlementTx.data,
    type: 'eip1559',
  })
  return tx
}

async function main() {
  await loadTokenMapping()
  const config = createAuthConfig({
    apiKey: apiKey!,
    apiSecret: apiSecret!,
    authServerUrl: authServerUrl,
  })

  try {
    const quote = await getQuote(config)
    if (!quote) {
      throw new Error('No quote received')
    }

    if (!quote.gas_sponsorship_info) {
      throw new Error('Transaction was not sponsored, abandoning...')
    }
    const gasSponsorshipInfo = quote.gas_sponsorship_info.gas_sponsorship_info
    console.log('Refund amount:', gasSponsorshipInfo.refund_amount)

    const resp = await assembleQuote(quote, config)

    const tx = resp.match_bundle.settlement_tx
    const txHash = await submitTransaction(tx)
    console.log(
      'Transaction submitted:',
      `${walletClient.chain.blockExplorers.default.url}/tx/${txHash}`,
    )
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
