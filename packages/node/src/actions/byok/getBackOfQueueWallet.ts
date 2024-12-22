import {
  BACK_OF_QUEUE_WALLET_ROUTE,
  type BYOKConfig,
  BaseError,
  type Wallet,
  getWithSymmetricKey,
} from '@renegade-fi/core'

export type GetBackOfQueueWalletReturnType = Wallet

export async function getBackOfQueueWallet(
  config: BYOKConfig,
): Promise<GetBackOfQueueWalletReturnType> {
  const { symmetricKey, walletId, getRelayerBaseUrl } = config
  const res = await getWithSymmetricKey(config, {
    key: symmetricKey,
    url: getRelayerBaseUrl(BACK_OF_QUEUE_WALLET_ROUTE(walletId)),
  })
  if (!res.wallet) {
    throw new BaseError('Back of queue wallet not found')
  }
  return res.wallet
}
