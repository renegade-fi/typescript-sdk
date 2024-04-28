import { createWallet } from "./createWallet.js"
import { config } from "@renegade-fi/test"
import { beforeEach, test } from "vitest"

beforeEach(() => {
    config.setState({
        seed: "0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b",
    })
})

test("default", () => {
    createWallet(config)
})
