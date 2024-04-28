import { type Config } from "../createConfig.js"

export type DisconnectParameters = {}

export type DisconnectReturnType = Promise<void>

export async function disconnect(
    config: Config,
    parameters: DisconnectParameters = {},
): DisconnectReturnType {
    const {} = config
    const {} = parameters
    config.setState({ status: "disconnected", id: undefined, seed: undefined })
}
