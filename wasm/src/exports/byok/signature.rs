use contracts_common::custom_serde::BytesSerializable;
use ethers::{
    core::k256::ecdsa::SigningKey,
    types::{Signature, U256},
    utils::keccak256,
};
use js_sys::{Function, Promise};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

use crate::{
    common::types::Wallet,
    exports::error::WasmError,
    helpers::{bytes_from_hex_string, bytes_to_hex_string},
};

/// Generates a signature by calling the provided sign_message function
///
/// # Important Notes for `sign_message` Function:
/// - The `sign_message` function receives a hashed message (using keccak256),
///   so it should not hash the message again.
/// - The function should not prefix the message; it should sign the message as is.
/// - The signature should use `0x00` or `0x01` for the `v` value, following the
///   standard ECDSA recovery process where these values encode the y-parity of
///   the curve point. Do not use the Ethereum-specific values `0x1b` or `0x1c`,
///   which add an offset of 27 for blockchain-specific purposes.
/// - If using libraries like `viem`, avoid using `serializeSignature` as it
///   normalizes `v` to `0x1b` or `0x1c`. Instead, manually construct the 65-byte
///   signature by concatenating `r`, `s`, and the standard recovery byte (`0x00` or `0x01`).
pub async fn generate_signature(
    wallet: &Wallet,
    sign_message: &Function,
) -> Result<Vec<u8>, WasmError> {
    let comm_bytes = wallet
        .get_wallet_share_commitment()
        .inner()
        .serialize_to_bytes();

    let digest = keccak256(comm_bytes);
    let digest_hex = bytes_to_hex_string(&digest);

    let this = JsValue::null();
    let arg = JsValue::from_str(&digest_hex);

    let sig_promise: Promise = sign_message
        .call1(&this, &arg)
        .map_err(|_| WasmError::SignMessageInvocationFailed("call1 failed".into()))?
        .dyn_into()
        .map_err(|_| WasmError::SignMessageInvocationFailed("dyn_into Promise failed".into()))?;

    let signature = JsFuture::from(sig_promise)
        .await
        .map_err(|e| WasmError::PromiseRejected(e.as_string().unwrap_or_default()))?;

    let sig_hex = signature.as_string().ok_or(WasmError::ConversionFailed)?;
    let bytes = bytes_from_hex_string(&sig_hex).map_err(WasmError::SignatureHexDecodingFailed)?;

    Ok(bytes)
}

// For testing purposes
// TODO: Remove this
pub async fn generate_statement_signature(
    seed: &str,
    wallet: &Wallet,
) -> Result<Signature, WasmError> {
    let old_sk_root = crate::common::derivation::derive_sk_root_scalars(
        seed,
        &wallet.key_chain.public_keys.nonce,
    );
    let signing_key = SigningKey::try_from(&old_sk_root)
        .map_err(|e| WasmError::SigningKeyCreationFailed(e.to_string()))?;

    let comm_bytes = wallet
        .get_wallet_share_commitment()
        .inner()
        .serialize_to_bytes();

    let digest = keccak256(comm_bytes);

    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(|e| WasmError::SigningFailed(e.to_string()))?;

    let signature = Signature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    };

    Ok(signature)
}
