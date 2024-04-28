import path from "path"

import { defineWorkspace } from "vitest/config"

const alias = {
    "@renegade-fi/core": path.resolve(__dirname, "./packages/core/src"),
    "@renegade-fi/test": path.resolve(__dirname, "./packages/test/src"),
}

export default defineWorkspace([
    {
        test: {
            name: "@renegade-fi/core",
            include: ["./packages/core/src/**/*.test.ts"],
            environment: "happy-dom",
            testTimeout: 10_000,
        },
        resolve: { alias },
    },
    {
        test: {
            name: "@renegade-fi/test",
            include: ["./packages/test/src/**/*.test.ts"],
        },
        resolve: { alias },
    },
])
