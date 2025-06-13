#![allow(incomplete_features)]
#![feature(generic_const_exprs)]

use crate::types::Scalar;
use circuit_types::keychain::{NonNativeScalar, PublicSigningKey};
use common::derivation::{
    derive_root_signing_key, derive_sk_root, derive_sk_root_signing_key, derive_symmetric_key,
    derive_wallet_keychain,
};
use contracts_common::custom_serde::BytesSerializable;
use ethers::{
    core::k256::ecdsa::SigningKey as EthersSigningKey,
    types::{Signature as EthersSignature, U256},
    utils::keccak256,
};
use helpers::{
    bytes_from_hex_string, nonnative_scalar_to_hex_string, public_sign_key_to_hex_string,
};
use num_bigint::BigUint;
use wasm_bindgen::prelude::*;

pub mod circuit_types;
pub mod common;
pub mod errors;
pub mod external_api;
pub mod generation;
pub mod helpers;
pub mod key_rotation;
pub mod serde_def_types;
pub mod signature;
pub mod sol;
pub mod types;
pub mod utils;

// -------------------------
// | System-Wide Constants |
// -------------------------

/// The system-wide value of MAX_BALANCES; the number of allowable balances a
/// wallet holds
pub const MAX_BALANCES: usize = 10;

/// The system-wide value of MAX_ORDERS; the number of allowable orders a wallet
/// holds
pub const MAX_ORDERS: usize = 4;

// Substitute for SizedWalletShare::NUM_SCALARS
pub const NUM_SCALARS: usize = 70;

/// The number of bytes in a cluster symmetric key
pub const CLUSTER_SYMMETRIC_KEY_LENGTH: usize = 32;

#[wasm_bindgen]
pub fn derive_sk_root_from_seed(seed: &str, nonce: u64) -> Result<JsValue, JsError> {
    let root_key = derive_root_signing_key(seed)?;

    let sk_root = derive_sk_root(&root_key, Some(&Scalar::from(nonce)))?;
    let sk_root_biguint = BigUint::from_bytes_be(&sk_root.to_bytes_be());
    // TODO: Should be able to .into() here
    let sk_root_scalar: NonNativeScalar<2> = NonNativeScalar::try_from(&sk_root_biguint)?;
    let sk_root_hex = nonnative_scalar_to_hex_string(&sk_root_scalar);
    Ok(JsValue::from_str(&sk_root_hex))
}

#[wasm_bindgen]
pub fn get_pk_root(seed: &str, nonce: u64) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, Some(&Scalar::from(nonce)))?;
    let keychain = derive_wallet_keychain(&sk_root)?;
    let pk_root = public_sign_key_to_hex_string(&keychain.public_keys.pk_root)?;
    Ok(JsValue::from_str(&pk_root))
}

#[wasm_bindgen]
pub fn get_pk_root_scalars(
    seed: Option<String>,
    nonce: Option<u64>,
    public_key: Option<String>,
) -> Result<Vec<JsValue>, JsError> {
    if let Some(pk_hex) = public_key {
        let pk_root_bytes = bytes_from_hex_string(&pk_hex)?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)?;
        Ok(vec![
            JsValue::from_str(&pk_root.x.scalar_words[0].to_biguint().to_string()),
            JsValue::from_str(&pk_root.x.scalar_words[1].to_biguint().to_string()),
            JsValue::from_str(&pk_root.y.scalar_words[0].to_biguint().to_string()),
            JsValue::from_str(&pk_root.y.scalar_words[1].to_biguint().to_string()),
        ])
    } else if let Some(seed_str) = seed {
        let nonce_val =
            nonce.ok_or(JsError::new("nonce must be provided when seed is provided"))?;
        let sk_root = derive_sk_root_signing_key(&seed_str, Some(&Scalar::from(nonce_val)))?;
        let keychain = derive_wallet_keychain(&sk_root)?;
        Ok(keychain
            .public_keys
            .to_scalars()
            .iter()
            .map(|scalar| JsValue::from_str(&scalar.to_biguint().to_string()))
            .collect())
    } else {
        Err(JsError::new("Either seed or public_key must be provided"))
    }
}

#[wasm_bindgen]
pub fn get_symmetric_key(seed: &str) -> Result<JsValue, JsError> {
    utils::set_panic_hook();
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let symmetric_key = derive_symmetric_key(&sk_root)?;

    Ok(JsValue::from_str(&symmetric_key.to_hex_string()))
}

pub fn sign_commitment(
    key: &NonNativeScalar<2>,
    commitment: Scalar,
) -> Result<EthersSignature, JsError> {
    let signing_key = EthersSigningKey::try_from(key)?;
    // Hash the message and sign it
    let comm_bytes = commitment.inner().serialize_to_bytes();
    let digest = keccak256(comm_bytes);
    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(map_js_error!("failed to sign commitment: {}"))?;

    Ok(EthersSignature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    })
}
