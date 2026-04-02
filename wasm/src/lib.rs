use ark_ec::{CurveGroup, Group};
use ark_ed_on_bn254::{EdwardsProjective, Fr};
use ark_ff::PrimeField;
use ark_serialize::CanonicalSerialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Derive a Schnorr public key from 64 extended signature bytes.
///
/// Steps (matching the Rust SDK):
/// 1. Interpret bytes as big-endian integer, reduce mod Baby JubJub Fr
/// 2. Compute public key: scalar * G (generator point)
/// 3. Serialize as uncompressed affine (arkworks canonical format, little-endian)
/// 4. Return hex string with 0x prefix
#[wasm_bindgen]
pub fn derive_schnorr_public_key(extended_sig_bytes: &[u8]) -> Result<String, JsError> {
    let scalar = Fr::from_be_bytes_mod_order(extended_sig_bytes);
    let point = (EdwardsProjective::generator() * scalar).into_affine();

    let mut bytes = Vec::new();
    point
        .serialize_uncompressed(&mut bytes)
        .map_err(|e: ark_serialize::SerializationError| JsError::new(&e.to_string()))?;

    Ok(format!("0x{}", hex::encode(bytes)))
}
