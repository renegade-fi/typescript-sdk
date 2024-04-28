import { getWalletId } from "./getWalletId.js"
import { config } from "@renegade-fi/test"
import { beforeEach, expect, test } from "vitest"

beforeEach(() => {
    config.setState({
        seed: "0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b",
    })
})

test("default", () => {
    const walletId = getWalletId(config)
    console.log("🚀 ~ test ~ walletId:", walletId)
    expect(walletId).toBeDefined()
})

test("returns same value for same input", () => {
    const walletId1 = getWalletId(config)
    const walletId2 = getWalletId(config)
    expect(walletId1).toEqual(walletId2)
})

test("correct value", () => {
    const walletId = getWalletId(config)
    expect(walletId).toEqual("ecaac83e-4f50-e500-b615-e6c8d3b523dc")
})
