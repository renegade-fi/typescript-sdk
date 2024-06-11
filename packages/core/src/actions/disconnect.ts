import type { Config } from '../createConfig.js'

export type DisconnectReturnType = Promise<void>

export async function disconnect(config: Config): DisconnectReturnType {
  config.setState({})
}
