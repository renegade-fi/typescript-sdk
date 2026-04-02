/* tslint:disable */
/* eslint-disable */

/**
 * Derive a Schnorr public key from 64 extended signature bytes.
 *
 * Steps (matching the Rust SDK):
 * 1. Interpret bytes as big-endian integer, reduce mod Baby JubJub Fr
 * 2. Compute public key: scalar * G (generator point)
 * 3. Serialize as uncompressed affine (arkworks canonical format, little-endian)
 * 4. Return hex string with 0x prefix
 */
export function derive_schnorr_public_key(extended_sig_bytes: Uint8Array): string;

export function init(): void;
