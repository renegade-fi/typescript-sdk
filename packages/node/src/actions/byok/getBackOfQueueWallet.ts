import {
  BACK_OF_QUEUE_WALLET_ROUTE,
  type BYOKConfig,
  BaseError,
  type Wallet,
  getWithSymmetricKey,
} from '@renegade-fi/core'

export type GetBackOfQueueWalletParameters = {
  symmetricKey: `0x${string}`
  walletId: string
}

export type GetBackOfQueueWalletReturnType = Wallet

export async function getBackOfQueueWallet(
  config: BYOKConfig,
  parameters: GetBackOfQueueWalletParameters,
): Promise<GetBackOfQueueWalletReturnType> {
  const { symmetricKey, walletId } = parameters
  const { getRelayerBaseUrl } = config
  const res = await getWithSymmetricKey(config, {
    key: symmetricKey,
    url: getRelayerBaseUrl(BACK_OF_QUEUE_WALLET_ROUTE(walletId)),
  })
  if (!res.wallet) {
    throw new BaseError('Back of queue wallet not found')
  }
  return res.wallet
}
