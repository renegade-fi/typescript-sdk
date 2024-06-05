'use client'

import type { Config } from '@renegade-fi/core'
import { type State, hydrate } from '@renegade-fi/core'
import { type ReactElement, useEffect, useRef } from 'react'

export type HydrateProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
  const { children, config, initialState, reconnectOnMount = true } = parameters

  const { onMount } = hydrate(config, {
    initialState,
    reconnectOnMount,
  })

  // Hydrate for non-SSR
  if (!config._internal.ssr) onMount()

  // Hydrate for SSR
  const active = useRef(true)
  useEffect(() => {
    if (!active.current) return

    // Initialize RustUtils.default() when the component mounts
    const initRustUtils = async () => {
      try {
        await config.utils.default()
        config.setState(x => ({ ...x, initialized: true }))
        console.log('🦀 Rust utils initialized successfully')
        // Hydration needs to wait for WASM to initialize, causing state flash
        if (!config._internal.ssr) return
        onMount()
      } catch (error) {
        console.error('❌ Failed to initialize Rust utils', error)
      }
    }
    initRustUtils()

    return () => {
      active.current = false
    }
  }, [onMount, config])

  return children as ReactElement
}
