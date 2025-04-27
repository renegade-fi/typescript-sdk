import { formatUnits, parseUnits } from "viem";

import type { Token } from "../types/token.js";

export function formatAmount(amount: bigint, token: Token, decimals = 2) {
    let formatted = formatUnits(amount, token.decimals);
    if (formatted.includes(".")) {
        const [integerPart, decimalPart = ""] = formatted.split(".");
        formatted = `${integerPart}.${decimalPart.substring(0, decimals)}`;
    }
    return formatted;
}

export function parseAmount(amount: string, token: Token) {
    const decimals = token.decimals;
    if (!decimals) throw new Error(`Decimals not found for 0x${token.address}`);
    // TODO: Should try to fetch decimals from on chain
    return parseUnits(amount, decimals);
}
