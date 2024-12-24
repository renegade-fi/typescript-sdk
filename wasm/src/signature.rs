use contracts_common::custom_serde::BytesSerializable;
use ethers::{
    types::{Signature, U256},
    utils::keccak256,
};
use js_sys::{Function, Promise};
use k256::ecdsa::SigningKey;
use num_bigint::BigUint;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

use crate::{
    circuit_types::transfers::{
        to_contract_external_transfer, ExternalTransfer, ExternalTransferDirection,
    },
    common::{derivation::derive_sk_root_scalars, types::Wallet},
    helpers::{bytes_from_hex_string, bytes_to_hex_string},
};

/// Helper function to sign a message with a SigningKey and return an Ethers Signature
fn sign_with_key(signing_key: &SigningKey, message: &[u8]) -> Result<Vec<u8>, String> {
    let digest = keccak256(message);
    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(|_| String::from("Failed to sign message"))?;

    let signature = Signature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    };

    Ok(signature.to_vec())
}

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
    let comm_bytes = comm.inner().serialize_to_bytes();

    match key_type {
        "internal" => {
            let old_sk_root = derive_sk_root_scalars(seed, &wallet.key_chain.public_keys.nonce);
            let sk_root: SigningKey = SigningKey::try_from(&old_sk_root)
                .map_err(|_| String::from("Failed to create signing key"))?;
            sign_with_key(&sk_root, &comm_bytes)
        }
        "external" => {
            let sign_message = sign_message.ok_or_else(|| {
                String::from("sign_message function is required for external key type")
            })?;
            generate_signature(&comm_bytes, sign_message).await
        }
        _ => Err(String::from("Invalid key type")),
    }
}

/// Generates a signature by calling the provided sign_message function with a message
pub async fn generate_signature(
    message: &[u8],
    sign_message: &Function,
) -> Result<Vec<u8>, String> {
    let digest = keccak256(message);
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

/// Creates and serializes an external transfer for withdrawal
fn create_withdrawal_transfer(
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

    postcard::to_allocvec(&contract_transfer)
        .map_err(|e| format!("Failed to serialize transfer: {e}"))
}

/// Signs a withdrawal authorization based on key type.
///
/// Internal type uses seed to derive signing key.
/// External type uses provided sign_message function.
pub async fn sign_withdrawal_authorization(
    wallet: &Wallet,
    seed: &str,
    mint: BigUint,
    amount: u128,
    account_addr: BigUint,
    key_type: &str,
    sign_message: Option<&Function>,
) -> Result<Vec<u8>, String> {
    let transfer_bytes = create_withdrawal_transfer(mint, amount, account_addr)?;

    match key_type {
        "internal" => {
            let old_sk_root = derive_sk_root_scalars(seed, &wallet.key_chain.public_keys.nonce);
            let sk_root: SigningKey = SigningKey::try_from(&old_sk_root)
                .map_err(|_| String::from("Failed to create signing key"))?;
            sign_with_key(&sk_root, &transfer_bytes)
        }
        "external" => {
            let sign_message = sign_message.ok_or_else(|| {
                String::from("sign_message function is required for external key type")
            })?;
            generate_signature(&transfer_bytes, sign_message).await
        }
        _ => Err(format!("Invalid key type: {key_type}")),
    }
}
