'use client'

import { createContext, useContext } from 'react'

type WasmContextValue = {
  isInitialized: boolean
}

export const WasmContext = createContext<WasmContextValue | undefined>(
  undefined,
)

export function useWasmInitialized() {
  const context = useContext(WasmContext)

  if (!context) {
    throw new Error(
      'useWasmInitialized must be used within a <RenegadeProvider />',
    )
  }

  return context.isInitialized
}
