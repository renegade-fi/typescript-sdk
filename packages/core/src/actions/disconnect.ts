import type { Config } from '../createConfig.js'

export type DisconnectReturnType = Promise<void>

export async function disconnect(config: Config): DisconnectReturnType {
  config.setState({ status: 'disconnected', id: undefined, seed: undefined })
}
