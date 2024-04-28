//! Keychain helpers for the wallet

use ethers::{
    core::k256::ecdsa::SigningKey as EthersSigningKey,
    types::{Signature, U256},
    utils::keccak256,
};

use crate::types::Scalar;

use super::types::Wallet;

/// Error message emitted when the wallet does not have an `sk_root` value
const ERR_NO_SK_ROOT: &str = "wallet does not have an `sk_root` value";

impl Wallet {
    /// Sign a wallet transition commitment with the wallet's keychain
    ///
    /// The contracts expect a recoverable signature with the recover ID set to
    /// 0/1; we use ethers `sign_prehash_recoverable` to generate this signature
    pub fn sign_commitment(&self, commitment: Scalar) -> Result<Signature, String> {
        // Fetch the `sk_root` key
        let root_key = self
            .key_chain
            .secret_keys
            .sk_root
            .as_ref()
            .ok_or(ERR_NO_SK_ROOT)?;
        let key = EthersSigningKey::try_from(root_key)?;

        // Hash the message and sign it
        let comm_bytes = commitment.to_biguint().to_bytes_be();
        let digest = keccak256(comm_bytes);
        let (sig, recovery_id) = key
            .sign_prehash_recoverable(&digest)
            .map_err(|e| format!("failed to sign commitment: {}", e))?;

        Ok(Signature {
            r: U256::from_big_endian(&sig.r().to_bytes()),
            s: U256::from_big_endian(&sig.s().to_bytes()),
            v: recovery_id.to_byte() as u64,
        })
    }
}
