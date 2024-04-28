"use client"

import { type Config } from "@renegade-fi/core"
import { useContext } from "react"

import { RenegadeContext } from "../context.js"
import { RenegadeProviderNotFoundError } from "../errors/context.js"
import type { ConfigParameter } from "../types/properties.js"

export type UseConfigParameters<config extends Config = Config> = ConfigParameter<config>

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig<config extends Config = Config>(
    parameters: UseConfigParameters<config> = {},
): UseConfigReturnType<config> {
    const config = parameters.config ?? useContext(RenegadeContext)
    if (!config) throw new RenegadeProviderNotFoundError()
    return config as UseConfigReturnType<config>
}
