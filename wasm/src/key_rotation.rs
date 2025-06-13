use crate::{
    circuit_types::keychain::PublicSigningKey,
    common::{derivation::derive_sk_root_scalars, types::Wallet},
    helpers::{bytes_from_hex_string, public_sign_key_to_hex_string},
};
use k256::ecdsa::SigningKey;
use wasm_bindgen::JsError;

/// Handles wallet key rotation based on whether a new external key is provided.
///
/// For internal key rotation, uses the provided seed to derive the next key.
/// For external key rotation, uses the provided new_public_key.
///
/// # Returns
/// A tuple containing:
/// - The new public key as a hex string, if rotation occurred
/// - The previous signing key, if seed was provided
pub fn handle_key_rotation(
    wallet: &mut Wallet,
    seed: Option<&str>,
    new_public_key: Option<String>,
) -> Result<(Option<String>, Option<SigningKey>), JsError> {
    // Extract the current signing key if seed is provided
    let old_signing_key = match seed {
        Some(seed_str) => {
            let sk_root_scalars =
                derive_sk_root_scalars(seed_str, &wallet.key_chain.public_keys.nonce)?;

            Some(SigningKey::try_from(&sk_root_scalars)?)
        }
        None => None,
    };

    // Use existing rotation logic
    let next_public_key = determine_next_key(wallet, seed, new_public_key)?;

    // If we have a new key, perform the rotation
    if let Some(ref next_key) = next_public_key {
        maybe_rotate_to_key(wallet, next_key)?;
    }

    Ok((next_public_key, old_signing_key))
}

/// Gets the next public key based on whether a new external key is provided.
fn determine_next_key(
    wallet: &Wallet,
    seed: Option<&str>,
    new_public_key: Option<String>,
) -> Result<Option<String>, JsError> {
    if let Some(key) = new_public_key {
        return Ok(Some(key));
    }

    if let Some(seed) = seed {
        let next_key = wallet.key_chain.get_next_rotated_public_key(seed)?;
        let next_key_hex = public_sign_key_to_hex_string(&next_key)?;
        return Ok(Some(next_key_hex));
    }

    Ok(None)
}

/// Updates wallet's key if different from current.
fn maybe_rotate_to_key(wallet: &mut Wallet, new_key_hex: &str) -> Result<(), JsError> {
    // Parse and validate the new key
    let new_pk_root = bytes_from_hex_string(new_key_hex)?;
    let current_pk_root = wallet.key_chain.pk_root().to_uncompressed_bytes()?;

    // Only rotate if the key is actually different
    if current_pk_root != new_pk_root {
        // Convert bytes to public key
        let new_pk_root = PublicSigningKey::from_bytes(&new_pk_root)?;

        // Update the wallet's key
        wallet.key_chain.increment_nonce();
        wallet.key_chain.set_pk_root(new_pk_root);
    }
    Ok(())
}
