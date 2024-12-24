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

/// Signs a wallet commitment.
pub async fn sign_wallet_commitment(
    wallet: &Wallet,
    seed: Option<&str>,
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, String> {
    let comm = wallet.get_wallet_share_commitment();
    let comm_bytes = comm.inner().serialize_to_bytes();
    sign_message(wallet, seed, &comm_bytes, external_signer).await
}

/// Signs a withdrawal authorization.
pub async fn sign_withdrawal_authorization(
    wallet: &Wallet,
    seed: Option<&str>,
    mint: BigUint,
    amount: u128,
    account_addr: BigUint,
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, String> {
    let transfer = ExternalTransfer {
        mint,
        amount,
        direction: ExternalTransferDirection::Withdrawal,
        account_addr,
    };

    let contract_transfer = to_contract_external_transfer(&transfer)
        .map_err(|_| String::from("Failed to convert transfer"))?;

    let contract_transfer_bytes = postcard::to_allocvec(&contract_transfer)
        .map_err(|e| format!("Failed to serialize transfer: {e}"))?;

    sign_message(wallet, seed, &contract_transfer_bytes, external_signer).await
}

/// Signs a message using either internal or external signing method.
///
/// For internal signing, uses the seed to derive a signing key.
/// For external signing, uses the provided external_signer function.
pub async fn sign_message(
    wallet: &Wallet,
    seed: Option<&str>,
    message: &[u8],
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, String> {
    if let Some(signer) = external_signer {
        sign_with_external_key(message, Some(signer)).await
    } else if let Some(seed) = seed {
        sign_with_internal_key(wallet, seed, message)
    } else {
        Err(String::from("Either seed or external signer is required"))
    }
}

/// Helper function to sign a message with a derived SigningKey and return an Ethers Signature
fn sign_with_internal_key(wallet: &Wallet, seed: &str, message: &[u8]) -> Result<Vec<u8>, String> {
    let sk_root_scalars = derive_sk_root_scalars(seed, &wallet.key_chain.public_keys.nonce);
    let sk_root: SigningKey = SigningKey::try_from(&sk_root_scalars)
        .map_err(|_| String::from("Failed to create signing key"))?;

    let digest = keccak256(message);
    let (sig, recovery_id) = sk_root
        .sign_prehash_recoverable(&digest)
        .map_err(|_| String::from("Failed to sign message"))?;

    let signature = Signature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    };

    Ok(signature.to_vec())
}

/// Generates a signature by calling the provided sign_message function with a message
async fn sign_with_external_key(
    message: &[u8],
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, String> {
    let sign_message = external_signer
        .ok_or_else(|| String::from("sign_message function is required for external key type"))?;

    let message_hex = bytes_to_hex_string(message);

    let this = JsValue::null();
    let arg = JsValue::from_str(&message_hex);

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
