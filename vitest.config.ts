import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        testTimeout: 400000,
        exclude: ["packages/template/*"],
    },
    plugins: [topLevelAwait(), wasm()],
});
