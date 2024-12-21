use ethers::utils::keccak256;
use js_sys::{Function, Promise};
use num_bigint::BigUint;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;

use crate::{
    common::{keychain::HmacKey, types::WalletIdentifier},
    exports::error::Error,
    helpers::bytes_from_hex_string,
    types::Scalar,
};

/// The message used to derive the blinder stream seed
const BLINDER_STREAM_SEED_MESSAGE: &[u8] = b"blinder seed";
/// The messages used to derive the share stream seed
const SHARE_STREAM_SEED_MESSAGE: &[u8] = b"share seed";
/// The message used to derive the wallet's symmetric key
const SYMMETRIC_KEY_MESSAGE: &[u8] = b"symmetric key";
/// The message used to derive the wallet's match key
const MATCH_KEY_MESSAGE: &[u8] = b"match key";
/// The message used to derive the wallet's ID
const WALLET_ID_MESSAGE: &[u8] = b"wallet id";

/// The number of bytes from a keccak hash
const KECCAK_HASH_BYTES: usize = 32;
/// The number of bytes we extend into to get a scalar
const EXTENDED_BYTES: usize = 64;
/// The number of bytes in a wallet ID
const WALLET_ID_BYTES: usize = 16;

/// Construct a wallet ID from the given Ethereum keypair
///
/// This is done to ensure deterministic wallet recovery
pub async fn derive_wallet_id(sign_message: &Function) -> Result<WalletIdentifier, Error> {
    let bytes = get_extended_sig_bytes(WALLET_ID_MESSAGE, sign_message).await?;
    Ok(WalletIdentifier::from_slice(&bytes[..WALLET_ID_BYTES])
        .map_err(|_| Error::new("Failed to create wallet ID"))?)
}

pub async fn derive_blinder_seed(sign_message: &Function) -> Result<Scalar, Error> {
    // Sign the blinder seed message and convert to a scalar
    derive_scalar(BLINDER_STREAM_SEED_MESSAGE, sign_message).await
}

/// Construct the share seed for the wallet
pub async fn derive_share_seed(sign_message: &Function) -> Result<Scalar, Error> {
    // Sign the share seed message and convert to a scalar
    derive_scalar(SHARE_STREAM_SEED_MESSAGE, sign_message).await
}

pub async fn derive_sk_match(sign_message: &Function) -> Result<Scalar, Error> {
    derive_scalar(MATCH_KEY_MESSAGE, sign_message).await
}

pub async fn derive_symmetric_key(sign_message: &Function) -> Result<HmacKey, Error> {
    get_sig_bytes(SYMMETRIC_KEY_MESSAGE, sign_message)
        .await
        .map(HmacKey)
}

/// Get a `Scalar` from a signature on a message
async fn derive_scalar(msg: &[u8], sign_message: &Function) -> Result<Scalar, Error> {
    let bytes = get_extended_sig_bytes(msg, sign_message).await?;
    Ok(Scalar::from(BigUint::from_bytes_be(&bytes)))
}

/// Sign a message, serialize the signature into bytes, and extend the bytes to
/// support secure reduction into a field
async fn get_extended_sig_bytes(
    msg: &[u8],
    sign_message: &Function,
) -> Result<[u8; EXTENDED_BYTES], Error> {
    let bytes = get_sig_bytes(msg, sign_message).await?;
    Ok(extend_to_64_bytes(&bytes))
}

/// Sign a message, serialize the signature into bytes
async fn get_sig_bytes(
    msg: &[u8],
    sign_message: &Function,
) -> Result<[u8; KECCAK_HASH_BYTES], Error> {
    let digest = keccak256(msg);
    let digest_hex = format!("0x{}", hex::encode(&digest));
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

    // Take the keccak hash of the signature to disperse its elements
    Ok(keccak256(bytes))
}

/// Extend the given byte array to 64 bytes, double the length of the original
///
/// This is necessary to give a uniform sampling of a field that these bytes are
/// reduced into, the bitlength must be significantly larger than the field's
/// bitlength to avoid sample bias via modular reduction
fn extend_to_64_bytes(bytes: &[u8]) -> [u8; EXTENDED_BYTES] {
    let mut extended = [0; EXTENDED_BYTES];
    let top_bytes = keccak256(bytes);
    extended[..KECCAK_HASH_BYTES].copy_from_slice(bytes);
    extended[KECCAK_HASH_BYTES..].copy_from_slice(&top_bytes);
    extended
}
