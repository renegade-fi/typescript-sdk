use alloy_sol_types::SolValue;
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
        to_arbitrum_external_transfer, to_base_external_transfer, ExternalTransfer,
        ExternalTransferDirection,
    },
    common::types::{Chain, Wallet},
    helpers::{bytes_from_hex_string, bytes_to_hex_string},
    map_js_error,
};

/// Signs a wallet commitment.
pub async fn sign_wallet_commitment(
    wallet: &Wallet,
    signing_key: Option<&SigningKey>,
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, JsError> {
    let comm = wallet.get_wallet_share_commitment();
    let comm_bytes = comm.inner().serialize_to_bytes();
    sign_message(signing_key, &comm_bytes, external_signer).await
}

/// Signs a withdrawal authorization.
pub async fn sign_withdrawal_authorization(
    chain: &Chain,
    signing_key: Option<&SigningKey>,
    mint: BigUint,
    amount: u128,
    account_addr: BigUint,
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, JsError> {
    let transfer = ExternalTransfer {
        mint,
        amount,
        direction: ExternalTransferDirection::Withdrawal,
        account_addr,
    };

    let contract_transfer_bytes = match chain {
        &Chain::ArbitrumOne | &Chain::ArbitrumSepolia => {
            let contract_transfer = to_arbitrum_external_transfer(&transfer)
                .map_err(map_js_error!("Failed to convert transfer: {}"))?;

            postcard::to_allocvec(&contract_transfer)
                .map_err(map_js_error!("Failed to serialize transfer: {}"))?
        }
        &Chain::BaseMainnet | &Chain::BaseSepolia => {
            let contract_transfer = to_base_external_transfer(&transfer)
                .map_err(map_js_error!("Failed to convert transfer: {}"))?;

            contract_transfer.abi_encode()
        }
        _ => {
            return Err(JsError::new("Unsupported chain"));
        }
    };

    sign_message(signing_key, &contract_transfer_bytes, external_signer).await
}

/// Signs a message using either internal or external signing method.
///
/// For internal signing, uses the provided SigningKey.
/// For external signing, uses the provided external_signer function.
pub async fn sign_message(
    signing_key: Option<&SigningKey>,
    message: &[u8],
    external_signer: Option<&Function>,
) -> Result<Vec<u8>, JsError> {
    if let Some(signer) = external_signer {
        sign_with_external_key(message, Some(signer)).await
    } else if let Some(key) = signing_key {
        sign_with_internal_key(key, message)
    } else {
        Err(JsError::new(
            "Either signing key or external signer is required",
        ))
    }
}

/// Helper function to sign a message with a SigningKey and return an Ethers Signature
fn sign_with_internal_key(signing_key: &SigningKey, message: &[u8]) -> Result<Vec<u8>, JsError> {
    let digest = keccak256(message);
    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(map_js_error!("Failed to sign message: {}"))?;

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
) -> Result<Vec<u8>, JsError> {
    let sign_message = external_signer
        .ok_or_else(|| JsError::new("sign_message function is required for external key type"))?;

    let message_hex = bytes_to_hex_string(message);

    let this = JsValue::null();
    let arg = JsValue::from_str(&message_hex);

    let sig_promise: Promise = sign_message
        .call1(&this, &arg)
        .map_err(|e| {
            JsError::new(&format!(
                "Failed to invoke sign_message: {}",
                e.as_string().unwrap_or_default()
            ))
        })?
        .dyn_into()
        .map_err(|e| {
            JsError::new(&format!(
                "Failed to convert Promise to Signature: {}",
                e.as_string().unwrap_or_default()
            ))
        })?;

    let signature = JsFuture::from(sig_promise).await.map_err(|e| {
        JsError::new(&format!(
            "Failed to invoke sign_message: {}",
            e.as_string().unwrap_or_default()
        ))
    })?;

    let sig_hex = signature
        .as_string()
        .ok_or_else(|| JsError::new("Failed to convert signature to string"))?;

    bytes_from_hex_string(&sig_hex)
}
