import { type Config } from "../createConfig.js"

export type WatchStatusParameters = {
    onChange(status: Config["state"]["status"], prevStatus: Config["state"]["status"]): void
}

export type WatchStatusReturnType = () => void

export function watchStatus(
    config: Config,
    parameters: WatchStatusParameters,
): WatchStatusReturnType {
    const { onChange } = parameters

    return config.subscribe(state => state.status, onChange)
}
