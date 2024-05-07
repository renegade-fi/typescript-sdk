'use client'

import type { Config } from '@renegade-fi/core'
import { useContext } from 'react'

import { RenegadeContext } from '../context.js'
import { RenegadeProviderNotFoundError } from '../errors/context.js'
import type { ConfigParameter } from '../types/properties.js'
import type * as UtilsType from '../../renegade-utils/index.d.ts'

export type UseConfigParameters<
  config extends Config<typeof UtilsType> = Config<typeof UtilsType>,
> = ConfigParameter<config>

export type UseConfigReturnType<
  config extends Config<typeof UtilsType> = Config<typeof UtilsType>,
> = config

export function useConfig<
  config extends Config<typeof UtilsType> = Config<typeof UtilsType>,
>(parameters: UseConfigParameters<config> = {}): UseConfigReturnType<config> {
  const config =
    parameters.config ??
    (useContext(RenegadeContext) as Config<typeof UtilsType>)
  if (!config) throw new RenegadeProviderNotFoundError()
  return config as UseConfigReturnType<config>
}
