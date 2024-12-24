#![allow(incomplete_features)]
#![feature(generic_const_exprs)]

use crate::types::Scalar;
use circuit_types::keychain::{NonNativeScalar, PublicSigningKey};
use common::derivation::{
    derive_root_signing_key, derive_sk_root, derive_sk_root_signing_key, derive_symmetric_key,
    derive_wallet_keychain, wrap_eyre,
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
pub mod helpers;
pub mod key_rotation;
pub mod serde_def_types;
pub mod signature;
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
pub fn derive_sk_root_from_seed(seed: &str, nonce: u64) -> JsValue {
    let root_key = derive_root_signing_key(seed).unwrap();

    let sk_root = derive_sk_root(&root_key, Some(&Scalar::from(nonce))).unwrap();
    let sk_root_biguint = BigUint::from_bytes_be(&sk_root.to_bytes_be());
    // TODO: Should be able to .into() here
    let sk_root_scalar: NonNativeScalar<2> = NonNativeScalar::from(&sk_root_biguint);
    let sk_root_hex = nonnative_scalar_to_hex_string(&sk_root_scalar);
    JsValue::from_str(&sk_root_hex)
}

#[wasm_bindgen]
pub fn get_pk_root(seed: &str, nonce: u64) -> JsValue {
    let sk_root = derive_sk_root_signing_key(seed, Some(&Scalar::from(nonce))).unwrap();
    let keychain = wrap_eyre!(derive_wallet_keychain(&sk_root)).unwrap();
    let pk_root = public_sign_key_to_hex_string(&keychain.public_keys.pk_root);
    JsValue::from_str(&pk_root)
}

#[wasm_bindgen]
pub fn get_pk_root_scalars(
    seed: Option<String>,
    nonce: Option<u64>,
    public_key: Option<String>,
) -> Vec<JsValue> {
    if let Some(pk_hex) = public_key {
        let pk_root_bytes = bytes_from_hex_string(&pk_hex).unwrap();
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes).unwrap();
        vec![
            JsValue::from_str(&pk_root.x.scalar_words[0].to_biguint().to_string()),
            JsValue::from_str(&pk_root.x.scalar_words[1].to_biguint().to_string()),
            JsValue::from_str(&pk_root.y.scalar_words[0].to_biguint().to_string()),
            JsValue::from_str(&pk_root.y.scalar_words[1].to_biguint().to_string()),
        ]
    } else if let Some(seed_str) = seed {
        let nonce_val = nonce.expect("nonce must be provided when seed is provided");
        let sk_root =
            derive_sk_root_signing_key(&seed_str, Some(&Scalar::from(nonce_val))).unwrap();
        let keychain = wrap_eyre!(derive_wallet_keychain(&sk_root)).unwrap();
        keychain
            .public_keys
            .to_scalars()
            .iter()
            .map(|scalar| JsValue::from_str(&scalar.to_biguint().to_string()))
            .collect()
    } else {
        panic!("Either seed or public_key must be provided");
    }
}

#[wasm_bindgen]
pub fn get_symmetric_key(seed: &str) -> JsValue {
    utils::set_panic_hook();
    let sk_root = derive_sk_root_signing_key(seed, None).unwrap();
    let symmetric_key = derive_symmetric_key(&sk_root);

    JsValue::from_str(&symmetric_key.unwrap().to_hex_string())
}

pub fn sign_commitment(
    key: &NonNativeScalar<2>,
    commitment: Scalar,
) -> Result<EthersSignature, String> {
    let signing_key = EthersSigningKey::try_from(key)?;
    // Hash the message and sign it
    let comm_bytes = commitment.inner().serialize_to_bytes();
    let digest = keccak256(comm_bytes);
    let (sig, recovery_id) = signing_key
        .sign_prehash_recoverable(&digest)
        .map_err(|e| format!("failed to sign commitment: {}", e))?;

    Ok(EthersSignature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    })
}
