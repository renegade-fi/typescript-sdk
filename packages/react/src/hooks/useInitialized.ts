'use client'

import { type Config, watchInitialized } from '@renegade-fi/core'
import { useEffect, useState } from 'react'
import { useConfig } from './useConfig.js'

export type UseInitializedParameters = {
  config?: Config
}

export type UseInitializedReturnType = Config['state']['initialized']

export function useInitialized(
  parameters: UseInitializedParameters = {},
): UseInitializedReturnType {
  const config = useConfig(parameters)
  const [initialized, setInitialized] = useState(config.state.initialized)

  useEffect(() => {
    const unsubscribe = watchInitialized(config, {
      onChange: (initialized) => {
        setInitialized(initialized)
      },
    })
    return () => {
      unsubscribe()
    }
  }, [config])

  return initialized
}
