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
    common::{derivation::derive_sk_root_scalars, types::Wallet},
    helpers::{bytes_from_hex_string, bytes_to_hex_string},
    sign_commitment,
};

/// Signs a wallet commitment based on key type.
///
/// Internal type uses seed to derive signing key.
/// External type uses provided sign_message function.
pub async fn sign_wallet_commitment(
    wallet: &Wallet,
    seed: &str,
    key_type: &str,
    sign_message: Option<&Function>,
) -> Result<Vec<u8>, String> {
    let comm = wallet.get_wallet_share_commitment();

    match key_type {
        "internal" => {
            let old_sk_root = derive_sk_root_scalars(seed, &wallet.key_chain.public_keys.nonce);
            Ok(sign_commitment(&old_sk_root, comm)
                .map_err(|e| e.to_string())?
                .to_vec())
        }
        "external" => {
            let sign_message = sign_message.ok_or_else(|| {
                String::from("sign_message function is required for external key type")
            })?;
            generate_signature(wallet, sign_message).await
        }
        _ => Err(String::from("Invalid key type")),
    }
}

/// Generates a signature by calling the provided sign_message function
pub async fn generate_signature(
    wallet: &Wallet,
    sign_message: &Function,
) -> Result<Vec<u8>, String> {
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
            format!(
                "Failed to invoke sign_message: {}",
                e.as_string().unwrap_or_default()
            )
        })?
        .dyn_into()
        .map_err(|e| {
            format!(
                "Failed to convert Promise to Signature: {}",
                e.as_string().unwrap_or_default()
            )
        })?;

    let signature = JsFuture::from(sig_promise).await.map_err(|e| {
        format!(
            "Failed to invoke sign_message: {}",
            e.as_string().unwrap_or_default()
        )
    })?;

    let sig_hex = signature
        .as_string()
        .ok_or_else(|| String::from("Failed to convert signature to string"))?;
    let bytes = bytes_from_hex_string(&sig_hex)
        .map_err(|e| format!("Failed to convert signature to bytes: {}", e))?;

    Ok(bytes)
}

pub async fn authorize_withdrawal(
    sign_message: &Function,
    mint: BigUint,
    amount: u128,
    account_addr: BigUint,
) -> Result<Vec<u8>, String> {
    let transfer = ExternalTransfer {
        mint,
        amount,
        direction: ExternalTransferDirection::Withdrawal,
        account_addr,
    };

    let contract_transfer = to_contract_external_transfer(&transfer)
        .map_err(|_| String::from("Failed to convert transfer"))?;

    let buf = postcard::to_allocvec(&contract_transfer)
        .map_err(|e| format!("Failed to serialize transfer: {e}"))?;

    let digest = keccak256(&buf);
    let digest_hex = bytes_to_hex_string(&digest);

    let this = JsValue::null();
    let arg = JsValue::from_str(&digest_hex);

    let sig_promise: Promise = sign_message
        .call1(&this, &arg)
        .map_err(|e| {
            format!(
                "Failed to invoke sign_message: {}",
                e.as_string().unwrap_or_default()
            )
        })?
        .dyn_into()
        .map_err(|e| {
            format!(
                "Failed to convert Promise to Signature: {}",
                e.as_string().unwrap_or_default()
            )
        })?;

    let signature = JsFuture::from(sig_promise).await.map_err(|e| {
        format!(
            "Failed to invoke sign_message: {}",
            e.as_string().unwrap_or_default()
        )
    })?;

    let sig_hex = signature
        .as_string()
        .ok_or_else(|| String::from("Failed to convert signature to string"))?;
    let bytes = bytes_from_hex_string(&sig_hex)
        .map_err(|e| format!("Failed to convert signature to bytes: {}", e))?;

    Ok(bytes)
}
