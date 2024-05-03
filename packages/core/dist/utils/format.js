import { formatUnits, parseUnits } from 'viem';
export function formatAmount(amount, token) {
    const decimals = token.decimals;
    if (!decimals)
        throw new Error(`Decimals not found for 0x${token.address}`);
    let formatted = formatUnits(amount, decimals);
    if (formatted.includes('.')) {
        const [integerPart, decimalPart = ''] = formatted.split('.');
        formatted = `${integerPart}.${decimalPart.substring(0, 2)}`;
    }
    return formatted;
}
export function parseAmount(amount, token) {
    const decimals = token.decimals;
    if (!decimals)
        throw new Error(`Decimals not found for 0x${token.address}`);
    // TODO: Should try to fetch decimals from on chain
    return parseUnits(amount, decimals);
}
//# sourceMappingURL=format.js.map