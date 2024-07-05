#![allow(incomplete_features)]
#![feature(generic_const_exprs)]

use crate::helpers::hex_to_signing_key;
use common::derivation::{derive_wallet_keychain, wrap_eyre};
use helpers::biguint_from_hex_string;
use k256::ecdsa::{signature::Signer, Signature};
use wasm_bindgen::prelude::*;

pub mod circuit_types;
pub mod common;
pub mod errors;
pub mod external_api;
pub mod helpers;
pub mod serde_def_types;
pub mod types;

// -------------------------
// | System-Wide Constants |
// -------------------------

/// The system-wide value of MAX_BALANCES; the number of allowable balances a
/// wallet holds
pub const MAX_BALANCES: usize = 5;

/// The system-wide value of MAX_ORDERS; the number of allowable orders a wallet
/// holds
pub const MAX_ORDERS: usize = 5;

// Substitute for SizedWalletShare::NUM_SCALARS
pub const NUM_SCALARS: usize = 54;

/// The number of bytes in a cluster symmetric key
pub const CLUSTER_SYMMETRIC_KEY_LENGTH: usize = 32;

#[wasm_bindgen]
// sk_root: Hex
pub fn get_pk_root(sk_root: &str) -> JsValue {
    let signing_key = hex_to_signing_key(sk_root).unwrap();
    let pk_root = signing_key.verifying_key();
    JsValue::from_str(&hex::encode(pk_root.to_encoded_point(false).as_bytes()))
}

#[wasm_bindgen]
pub fn pk_root_scalars(sk_root: &str) -> Vec<JsValue> {
    let signing_key = hex_to_signing_key(sk_root).unwrap();
    let keychain = wrap_eyre!(derive_wallet_keychain(&signing_key)).unwrap();
    keychain
        .public_keys
        .to_scalars()
        .iter()
        .map(|scalar| JsValue::from_str(&scalar.to_biguint().to_string()))
        .collect()
}

// Get sk_root from signature over ROOT_KEY_MESSAGE
// #[wasm_bindgen]
// pub fn derive_signing_key(msg: &str) -> JsValue {
// }

// message: string
// sk_root: Hex
// return: Hex
#[wasm_bindgen]
pub fn sign_message(sk_root: &str, message: &str) -> JsValue {
    let message_bytes = message.as_bytes();
    let signing_key = hex_to_signing_key(sk_root).unwrap();
    let sig: Signature = signing_key.sign(message_bytes);
    let sig_hex = hex::encode(sig.to_bytes());
    JsValue::from_str(&sig_hex)
}

#[wasm_bindgen]
pub fn bigint_to_limbs(value: &str) -> JsValue {
    let bigint = biguint_from_hex_string(value).unwrap();
    let serialized = serde_json::to_string(&bigint).unwrap();
    JsValue::from_str(&serialized)
}
