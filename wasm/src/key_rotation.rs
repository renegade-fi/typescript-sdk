use crate::{
    circuit_types::keychain::PublicSigningKey,
    common::types::Wallet,
    helpers::{bytes_from_hex_string, public_sign_key_to_hex_string},
};

/// Handles wallet key rotation based on key type.
///
/// Internal type always rotates to the next derived key.
/// External type only rotates if a new key is provided.
///
/// # Arguments
/// * `wallet` - Target wallet
/// * `seed` - Seed for key derivation
/// * `key_type` - "internal" or "external"
/// * `new_public_key` - Optional new key for external type
///
/// # Returns
/// The rotated public key, if any
pub fn handle_key_rotation(
    wallet: &mut Wallet,
    seed: &str,
    key_type: &str,
    new_public_key: Option<String>,
) -> Result<Option<String>, String> {
    let next_public_key = determine_next_key(wallet, seed, key_type, new_public_key)?;

    // If we have a new key, perform the rotation
    if let Some(next_key) = &next_public_key {
        maybe_rotate_to_key(wallet, next_key)?;
    }

    Ok(next_public_key)
}

/// Gets the next public key based on key type.
fn determine_next_key(
    wallet: &Wallet,
    seed: &str,
    key_type: &str,
    new_public_key: Option<String>,
) -> Result<Option<String>, String> {
    match key_type {
        "internal" => {
            // For internal type, derive the next key in sequence
            let next_key = wallet.key_chain.get_next_rotated_public_key(seed)?;
            Ok(Some(public_sign_key_to_hex_string(&next_key)))
        }
        "external" => Ok(new_public_key),
        _ => Err("Invalid key type".to_string()),
    }
}

/// Updates wallet's key if different from current.
fn maybe_rotate_to_key(wallet: &mut Wallet, new_key_hex: &str) -> Result<(), String> {
    // Parse and validate the new key
    let new_pk_root =
        bytes_from_hex_string(new_key_hex).map_err(|e| format!("Invalid public key hex: {}", e))?;
    let current_pk_root = wallet.key_chain.pk_root().to_uncompressed_bytes();

    // Only rotate if the key is actually different
    if current_pk_root != new_pk_root {
        // Convert bytes to public key
        let new_pk_root = PublicSigningKey::from_bytes(&new_pk_root)
            .map_err(|e| format!("Failed to parse public key: {}", e))?;

        // Update the wallet's key
        wallet.key_chain.increment_nonce();
        wallet.key_chain.set_pk_root(new_pk_root);
    }
    Ok(())
}
