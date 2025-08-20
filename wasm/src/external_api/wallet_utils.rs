//! Utility functions for working with wallets

use itertools::Itertools;
use wasm_bindgen::prelude::*;

use crate::{
    common::derivation::{derive_blinder_seed, derive_sk_root_signing_key, derive_wallet_id},
    helpers::{deserialize_wallet, PoseidonCSPRNG},
};

#[wasm_bindgen]
pub fn derive_blinder_share(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let blinder_seed = derive_blinder_seed(&sk_root)?;
    let mut blinder_csprng = PoseidonCSPRNG::new(blinder_seed);
    let (blinder, blinder_private) = blinder_csprng
        .next_tuple()
        .ok_or(JsError::new("Failed to generate blinder tuple"))?;
    let blinder_share = blinder - blinder_private;
    Ok(JsValue::from_str(&blinder_share.to_biguint().to_string()))
}

#[wasm_bindgen]
pub fn wallet_id(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let wallet_id = derive_wallet_id(&sk_root)?;
    Ok(JsValue::from_str(&wallet_id.to_string()))
}

#[wasm_bindgen]
pub fn wallet_nullifier(wallet_str: &str) -> Result<JsValue, JsError> {
    let wallet = deserialize_wallet(wallet_str)?;
    let nullifier = wallet.get_wallet_nullifier();
    Ok(JsValue::bigint_from_str(
        &nullifier.to_biguint().to_string(),
    ))
}
