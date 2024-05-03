import { getRelayerWithAuth } from '../utils/http.js'

import { GET_WALLET_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'

export type ReconnectParameters = { id?: string }

export type ReconnectReturnType = Promise<void>

export async function reconnect(
  config: Config,
  parameters: ReconnectParameters,
): ReconnectReturnType {
  const { getRelayerBaseUrl } = config
  const { id } = parameters
  if (!id) {
    // Persisted state is malformed
    config.setState({ status: 'disconnected' })
    return
  }
  // If wallet in relayer, set status to in relayer
  await getRelayerWithAuth(config, getRelayerBaseUrl(GET_WALLET_ROUTE(id)))
    .then((res) => {
      if (res.wallet) {
        config.setState({ ...config.state, status: 'in relayer' })
      }
      return res.wallet
    })
    .catch((err) => {
      console.error('Error reconnecting: ', err)
      // Should lookup wallet in connect
      config.setState({
        status: 'disconnected',
        id: undefined,
        seed: undefined,
      })
    })
}
