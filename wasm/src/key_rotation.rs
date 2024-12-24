use crate::{
    circuit_types::keychain::PublicSigningKey,
    common::types::Wallet,
    helpers::{bytes_from_hex_string, public_sign_key_to_hex_string},
};

/// Handles wallet key rotation based on whether a new external key is provided.
///
/// If no new key is provided (new_public_key is None), rotates to the next derived key using seed.
/// If a new key is provided, rotates to that key.

/// # Returns
/// The rotated public key, if any
pub fn handle_key_rotation(
    wallet: &mut Wallet,
    seed: Option<&str>,
    new_public_key: Option<String>,
) -> Result<Option<String>, String> {
    let next_public_key = determine_next_key(wallet, seed, new_public_key)?;

    // If we have a new key, perform the rotation
    if let Some(ref next_key) = next_public_key {
        maybe_rotate_to_key(wallet, next_key)?;
    }

    Ok(next_public_key)
}

/// Gets the next public key based on whether a new external key is provided.
fn determine_next_key(
    wallet: &Wallet,
    seed: Option<&str>,
    new_public_key: Option<String>,
) -> Result<Option<String>, String> {
    if let Some(key) = new_public_key {
        return Ok(Some(key));
    }

    if let Some(seed) = seed {
        let next_key = wallet.key_chain.get_next_rotated_public_key(seed)?;
        return Ok(Some(public_sign_key_to_hex_string(&next_key)));
    }

    Ok(None)
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
