// Account secrets derivation, ported from rust-sdk/src/renegade_wallet_client/utils.rs
//
// Derives deterministic account credentials from an Ethereum private key and chain ID.
// The derivation signs structured messages with the key and hashes the results.

import { type Hex, keccak256, toBytes } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";
import { derive_schnorr_public_key } from "../renegade-sdk-wasm/index.js";
import { toBase64 } from "./utils.js";

// Message prefixes matching the Rust SDK constants
const ACCOUNT_ID_PREFIX = toBytes("account id");
const AUTH_HMAC_KEY_PREFIX = toBytes("auth hmac key");
const MASTER_VIEW_SEED_PREFIX = toBytes("master view seed");
const SCHNORR_KEY_PREFIX = toBytes("schnorr key");

const ACCOUNT_ID_BYTES = 16;

// BN254 scalar field modulus (Fr), used for master_view_seed reduction
const BN254_SCALAR_MODULUS =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Secrets derived from an Ethereum private key, used to authenticate
 * account actions against the relayer API.
 */
export class AccountSecrets {
    /** UUID identifying the account (first 16 bytes of a derived hash) */
    readonly accountId: string;
    /** 32-byte HMAC key for authenticating API requests */
    readonly authHmacKey: Uint8Array;
    /** BN254 scalar field element (decimal string), used for account state sync */
    readonly masterViewSeed: string;
    /** Schnorr public key as hex string (0x-prefixed, uncompressed Baby JubJub point) */
    readonly schnorrPublicKey: string;

    private constructor(
        accountId: string,
        authHmacKey: Uint8Array,
        masterViewSeed: string,
        schnorrPublicKey: string,
    ) {
        this.accountId = accountId;
        this.authHmacKey = authHmacKey;
        this.masterViewSeed = masterViewSeed;
        this.schnorrPublicKey = schnorrPublicKey;
    }

    /**
     * Derive account secrets from a viem PrivateKeyAccount and chain ID.
     *
     * This mirrors the Rust SDK's `AccountSecrets::new()`:
     * 1. Build message = prefix_bytes ++ chain_id as 8 big-endian bytes
     * 2. keccak256(message) → digest
     * 3. ECDSA sign the raw digest (no EIP-191 prefix)
     * 4. keccak256(signature) → 32 dispersed bytes
     * 5. Interpret those bytes per secret type
     */
    static async create(account: PrivateKeyAccount, chainId: number): Promise<AccountSecrets> {
        const accountId = await deriveAccountId(account, chainId);
        const authHmacKey = await deriveAuthHmacKey(account, chainId);
        const masterViewSeed = await deriveMasterViewSeed(account, chainId);
        const schnorrPublicKey = await deriveSchnorrPublicKey(account, chainId);
        return new AccountSecrets(accountId, authHmacKey, masterViewSeed, schnorrPublicKey);
    }

    /** Master view seed as a hex string (0x-prefixed) for sync requests */
    masterViewSeedHex(): string {
        return `0x${BigInt(this.masterViewSeed).toString(16)}`;
    }

    /** Base64-encode the HMAC key (with padding, matching Rust's STANDARD) */
    authHmacKeyBase64(): string {
        return toBase64(this.authHmacKey);
    }
}

// -----------
// | Helpers |
// -----------

/** Build the message bytes: prefix ++ chain_id as 8 big-endian bytes */
function buildMessage(prefix: Uint8Array, chainId: number): Uint8Array {
    const chainIdBytes = new Uint8Array(8);
    const view = new DataView(chainIdBytes.buffer);
    // Write chain ID as big-endian uint64
    view.setBigUint64(0, BigInt(chainId));
    const msg = new Uint8Array(prefix.length + 8);
    msg.set(prefix, 0);
    msg.set(chainIdBytes, prefix.length);
    return msg;
}

/**
 * Sign a message and return the keccak256-dispersed 32-byte result.
 *
 * Steps (matching Rust `get_sig_bytes`):
 * 1. keccak256(message) → digest
 * 2. account.sign({ hash: digest }) → ECDSA signature (raw hash signing, no EIP-191)
 * 3. keccak256(signature_bytes) → 32 dispersed bytes
 */
async function getSigBytes(msg: Uint8Array, account: PrivateKeyAccount): Promise<Uint8Array> {
    const digest = keccak256(msg);
    const sig: Hex = await account.sign({ hash: digest });
    return toBytes(keccak256(sig));
}

/**
 * Sign a message and return 64 extended bytes for secure field reduction.
 *
 * Steps (matching Rust `get_extended_sig_bytes`):
 * 1. getSigBytes(msg) → 32 bytes
 * 2. Extend: original 32 bytes ++ keccak256(original 32 bytes)
 *
 * The 64-byte result ensures uniform sampling when reduced mod a ~254-bit field.
 */
async function getExtendedSigBytes(
    msg: Uint8Array,
    account: PrivateKeyAccount,
): Promise<Uint8Array> {
    const sigBytes = await getSigBytes(msg, account);
    const topBytes = toBytes(keccak256(sigBytes));
    const extended = new Uint8Array(64);
    extended.set(sigBytes, 0);
    extended.set(topBytes, 32);
    return extended;
}

/**
 * Derive the master view seed as a BN254 scalar (decimal string).
 *
 * Interprets 64 extended sig bytes as a big-endian integer and reduces mod
 * the BN254 scalar field modulus, matching Rust's `Scalar::from_be_bytes_mod_order`.
 */
async function deriveMasterViewSeed(account: PrivateKeyAccount, chainId: number): Promise<string> {
    const msg = buildMessage(MASTER_VIEW_SEED_PREFIX, chainId);
    const extended = await getExtendedSigBytes(msg, account);
    // Interpret as big-endian unsigned integer
    let value = 0n;
    for (const byte of extended) {
        value = (value << 8n) | BigInt(byte);
    }
    return (value % BN254_SCALAR_MODULUS).toString();
}

/** Derive the account UUID from the first 16 bytes of the sig hash */
async function deriveAccountId(account: PrivateKeyAccount, chainId: number): Promise<string> {
    const msg = buildMessage(ACCOUNT_ID_PREFIX, chainId);
    const bytes = await getSigBytes(msg, account);
    return formatUuid(bytes.slice(0, ACCOUNT_ID_BYTES));
}

/** Derive the 32-byte HMAC key for API authentication */
async function deriveAuthHmacKey(account: PrivateKeyAccount, chainId: number): Promise<Uint8Array> {
    const msg = buildMessage(AUTH_HMAC_KEY_PREFIX, chainId);
    return getSigBytes(msg, account);
}

/**
 * Derive the Schnorr public key as a hex string.
 *
 * Computes extended sig bytes for the "schnorr key" prefix, then delegates
 * to the WASM module for Baby JubJub scalar multiplication and serialization.
 */
async function deriveSchnorrPublicKey(
    account: PrivateKeyAccount,
    chainId: number,
): Promise<string> {
    const msg = buildMessage(SCHNORR_KEY_PREFIX, chainId);
    const extended = await getExtendedSigBytes(msg, account);
    return derive_schnorr_public_key(extended);
}

/** Format 16 bytes as a UUID string (8-4-4-4-12) */
function formatUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
