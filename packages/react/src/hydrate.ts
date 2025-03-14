'use client'

import type { Config } from '@renegade-fi/core'
import { type State, hydrate } from '@renegade-fi/core'
import {
  type ReactElement,
  createElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import { WasmContext } from './wasm.js'

export type HydrateProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
  const { children, config, initialState, reconnectOnMount = true } = parameters
  const [isInitialized, setIsInitialized] = useState(false)

  const { onMount } = hydrate(config, {
    initialState,
    reconnectOnMount,
  })

  // Hydrate for non-SSR
  if (!config._internal.ssr) onMount()

  // Hydrate for SSR
  const active = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    config.utils
      .default()
      .then(() => {
        console.log('🚀 ~ WASM initialized')
        setIsInitialized(true)
        if (!active.current) return
        if (!config._internal.ssr) return
        // Rehydrate after WASM is initialized to prevent race condition
        onMount()
      })
      .catch((error: unknown) => {
        console.error('❌ Failed to initialize Rust utils', error)
      })
    return () => {
      active.current = false
    }
  }, [])

  return createElement(
    WasmContext.Provider,
    { value: { isInitialized } },
    children as ReactElement,
  )
}
