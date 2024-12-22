use crate::{
    circuit_types::keychain::PublicSigningKey, common::types::Wallet, exports::error::Error,
    helpers::bytes_from_hex_string,
};

/// Checks if the wallet's public key has been rotated and handles the rotation if needed.
///
/// This function will:
/// 1. Compare the current public key with the new one
/// 2. If different, increment the nonce and set the new public key
///
/// # Arguments
/// * `wallet` - The wallet to check for rotation
/// * `new_public_key` - The new public key in hex format
pub fn handle_key_rotation(wallet: &mut Wallet, new_public_key: &str) -> Result<(), Error> {
    let new_pk_root = bytes_from_hex_string(new_public_key)
        .map_err(|e| Error::invalid_parameter(format!("Invalid public key hex: {}", e)))?;
    let current_pk_root = wallet.key_chain.pk_root().to_uncompressed_bytes();

    if current_pk_root != new_pk_root {
        wallet.key_chain.increment_nonce();
        let new_pk_root = PublicSigningKey::from_bytes(&new_pk_root)
            .map_err(|e| Error::new(format!("Failed to parse public key: {}", e)))?;
        wallet.key_chain.set_pk_root(new_pk_root);
    }
    Ok(())
}
