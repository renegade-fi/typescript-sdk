import { getSkRoot } from "./getSkRoot.js"
import { config } from "@renegade-fi/test"
import { isHex } from "viem"
import { beforeEach, expect, test } from "vitest"

beforeEach(() => {
    config.setState({
        seed: "0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b",
    })
})

test("default", () => {
    const skRoot = getSkRoot(config)
    expect(skRoot).toBeDefined()
})

test("returns hex", () => {
    const skRoot = getSkRoot(config)
    expect(isHex(skRoot)).toBe(true)
})

test("returns same value for same input", () => {
    const skRoot1 = getSkRoot(config)
    const skRoot2 = getSkRoot(config)
    expect(skRoot1).toEqual(skRoot2)
})

test("correct value", () => {
    const skRoot = getSkRoot(config)
    expect(skRoot).toEqual("0xd4f0e5e68014782982f4760cf8d96a96264ec76f2e780fa7a0f51a9d72fb0f27")
})
