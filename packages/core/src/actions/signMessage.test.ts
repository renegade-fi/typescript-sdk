import { signMessage } from "./signMessage.js"
import { config } from "@renegade-fi/test"
import { isHex } from "viem"
import { beforeEach, expect, test } from "vitest"

beforeEach(() => {
    config.setState({
        seed: "0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b",
    })
})

test("default", () => {
    const message = signMessage(config, {
        message: "",
    })
    expect(message).toBeDefined()
})

test("returns hex", () => {
    const message = signMessage(config, {
        message: "",
    })
    expect(isHex(message)).toBe(true)
})

test("with message", () => {
    const sig = signMessage(config, {
        message: `Renegade`,
    })
    expect(sig).toEqual(
        "0x352c8e81086a41b25044536ddc0e6ea81fe523ecf641a9cedf116c0a24ae6ffb3324f370b3e4a4d5fb6275f506e78939c78690432c42935ecab6d176ba203ddd",
    )
})

test("signMessage with long message", () => {
    const longMessage = "a".repeat(1000) // Example of a long message
    const sig = signMessage(config, {
        message: longMessage,
    })
    expect(sig).toBeDefined()
    expect(isHex(sig)).toBe(true)
})

test("signMessage with special characters", () => {
    const specialCharsMessage = `!@#$%^&*()_+-=[]{}|;:'",.<>/?`
    const sig = signMessage(config, {
        message: specialCharsMessage,
    })
    expect(sig).toBeDefined()
    expect(isHex(sig)).toBe(true)
})
