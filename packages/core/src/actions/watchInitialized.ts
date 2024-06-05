import type { Config } from '../createConfig.js'

export type WatchInitializedParameters = {
  onChange(
    initialized: Config['state']['initialized'],
    prevInitialized: Config['state']['initialized'],
  ): void
}

export type WatchInitializedReturnType = () => void

export function watchInitialized(
  config: Config,
  parameters: WatchInitializedParameters,
): WatchInitializedReturnType {
  const { onChange } = parameters

  return config.subscribe((state) => state.initialized, onChange)
}
