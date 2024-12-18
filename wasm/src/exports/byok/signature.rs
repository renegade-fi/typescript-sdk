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
    common::{derivation::derive_sk_root_scalars, types::Wallet},
    exports::error::WasmError,
    helpers::bytes_from_hex_string,
};

/// Generates a signature by calling the provided sign_message function
///
/// # Arguments
/// * `wallet` - The wallet containing the commitment to sign
/// * `sign_message` - JavaScript function that will be called with a hex string
///                   argument prefixed with "0x" (e.g. "0x1234abcd...")
///
/// # Returns
/// * `Ok(Vec<u8>)` - The decoded signature bytes
/// * `Err(SignatureError)` - If signature generation or processing fails
///
/// # Expected JavaScript Interface
/// ```typescript
/// type SignMessage = (hexString: string) => Promise<string>;
/// ```
/// The sign_message function should:
/// 1. Accept a hex string prefixed with "0x" as input
/// 2. Return a Promise that resolves to a hex string prefixed with "0x"
pub async fn generate_signature(
    wallet: &Wallet,
    sign_message: &Function,
) -> Result<Vec<u8>, WasmError> {
    let comm = wallet.get_wallet_share_commitment();
    let comm_hex = format!("0x{}", hex::encode(&comm.to_bytes_be()));

    let this = JsValue::null();
    let arg = JsValue::from_str(&comm_hex);

    let sig_promise: Promise = sign_message
        .call1(&this, &arg)
        .map_err(|_| WasmError::SignMessageInvocationFailed("call1 failed".into()))?
        .dyn_into()
        .map_err(|_| WasmError::SignMessageInvocationFailed("dyn_into Promise failed".into()))?;

    let signature = JsFuture::from(sig_promise)
        .await
        .map_err(|e| WasmError::PromiseRejected(e.as_string().unwrap_or_default()))?;

    let sig_hex = signature.as_string().ok_or(WasmError::ConversionFailed)?;

    bytes_from_hex_string(&sig_hex).map_err(WasmError::SignatureHexDecodingFailed)
}

pub async fn generate_statement_signature(
    seed: &str,
    wallet: &Wallet,
) -> Result<Signature, WasmError> {
    let sk_root = derive_sk_root_scalars(seed, &wallet.key_chain.public_keys.nonce);
    let signing_key = SigningKey::try_from(&sk_root)
        .map_err(|e| WasmError::SigningKeyCreationFailed(e.to_string()))?;

    // Hash the message and sign it
    let comm_bytes = wallet
        .get_wallet_share_commitment()
        .inner()
        .serialize_to_bytes();
    let digest = keccak256(comm_bytes);
    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(|e| WasmError::SigningFailed(e.to_string()))?;

    Ok(Signature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    })
}
