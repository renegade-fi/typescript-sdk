import type { Config } from "@renegade-fi/core"

export type ConfigParameter<config extends Config = Config> = {
    config?: Config | config | undefined
}
