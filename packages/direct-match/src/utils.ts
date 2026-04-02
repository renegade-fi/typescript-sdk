/** Base64-encode without padding (matches Rust's STANDARD_NO_PAD) */
export function toBase64NoPad(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64").replace(/=+$/, "");
}

/** Base64-encode with padding (matches Rust's STANDARD) */
export function toBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
}
