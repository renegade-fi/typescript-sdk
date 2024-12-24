use contracts_common::custom_serde::BytesSerializable;
use ethers::utils::keccak256;
use js_sys::{Function, Promise};
use num_bigint::BigUint;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

use crate::{
    circuit_types::transfers::{
        to_contract_external_transfer, ExternalTransfer, ExternalTransferDirection,
    },
    common::types::Wallet,
    exports::error::Error,
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
) -> Result<Vec<u8>, Error> {
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
        .map_err(|e| {
            Error::sign_message(format!(
                "Failed to invoke sign_message: {}",
                e.as_string().unwrap_or_default()
            ))
        })?
        .dyn_into()
        .map_err(|e| {
            Error::sign_message(format!(
                "Failed to convert Promise to Signature: {}",
                e.as_string().unwrap_or_default()
            ))
        })?;

    let signature = JsFuture::from(sig_promise)
        .await
        .map_err(|e| Error::promise_rejected(e.as_string().unwrap_or_default()))?;

    let sig_hex = signature
        .as_string()
        .ok_or_else(|| Error::new("Failed to convert signature to string"))?;
    let bytes = bytes_from_hex_string(&sig_hex).map_err(|e| Error::sign_message(e.to_string()))?;

    Ok(bytes)
}

pub async fn authorize_withdrawal(
    sign_message: &Function,
    mint: BigUint,
    amount: u128,
    account_addr: BigUint,
) -> Result<Vec<u8>, Error> {
    let transfer = ExternalTransfer {
        mint,
        amount,
        direction: ExternalTransferDirection::Withdrawal,
        account_addr,
    };

    let contract_transfer = to_contract_external_transfer(&transfer)
        .map_err(|_| Error::new("Failed to convert transfer"))?;

    let buf = postcard::to_allocvec(&contract_transfer)
        .map_err(|e| Error::new(format!("Failed to serialize transfer: {e}")))?;

    let digest = keccak256(&buf);
    let digest_hex = bytes_to_hex_string(&digest);

    let this = JsValue::null();
    let arg = JsValue::from_str(&digest_hex);

    let sig_promise: Promise = sign_message
        .call1(&this, &arg)
        .map_err(|e| {
            Error::sign_message(format!(
                "Failed to invoke sign_message: {}",
                e.as_string().unwrap_or_default()
            ))
        })?
        .dyn_into()
        .map_err(|e| {
            Error::sign_message(format!(
                "Failed to convert Promise to Signature: {}",
                e.as_string().unwrap_or_default()
            ))
        })?;

    let signature = JsFuture::from(sig_promise)
        .await
        .map_err(|e| Error::promise_rejected(e.as_string().unwrap_or_default()))?;

    let sig_hex = signature
        .as_string()
        .ok_or_else(|| Error::new("Failed to convert signature to string"))?;
    let bytes = bytes_from_hex_string(&sig_hex).map_err(|e| Error::sign_message(e.to_string()))?;

    Ok(bytes)
}
