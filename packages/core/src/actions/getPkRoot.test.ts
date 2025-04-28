import { config } from "@renegade-fi/test";
import { isHex } from "viem";
import { beforeEach, expect, test } from "vitest";
import { getPkRoot } from "./getPkRoot.js";

beforeEach(() => {
    config.setState({
        seed: "0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b",
    });
});

test("default", () => {
    const pkRoot = getPkRoot(config);
    expect(pkRoot).toBeDefined();
});

test("returns hex", () => {
    const pkRoot = getPkRoot(config);
    expect(isHex(pkRoot)).toBe(true);
});

test("returns same value for same input", () => {
    const pkRoot1 = getPkRoot(config);
    const pkRoot2 = getPkRoot(config);
    expect(pkRoot1).toEqual(pkRoot2);
});

test("correct value", () => {
    const pkRoot = getPkRoot(config);
    expect(pkRoot).toEqual(
        "0x04d4aea83fefb16ecdc17c17fb5ce37343358f0f0269d58a1022b359656383fe564b94cc2aa10fbea5496b5866f54195f26528b72c954e31ae6aa696e2f015c550",
    );
});
