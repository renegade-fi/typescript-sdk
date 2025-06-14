//! Keychain helpers for the wallet

use crate::circuit_types::keychain::{
    PublicIdentificationKey, PublicKeyChain, PublicSigningKey, SecretIdentificationKey,
    SecretSigningKey,
};
use crate::helpers::{bytes_from_hex_string, bytes_to_hex_string};
use crate::{map_js_error, types::Scalar};
use contracts_common::custom_serde::BytesSerializable;
use derivative::Derivative;
use ethers::{
    core::k256::ecdsa::SigningKey as EthersSigningKey,
    types::{Signature, U256},
    utils::keccak256,
};
use hmac::Mac;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use wasm_bindgen::JsError;

use super::derivation::{derive_sk_root_signing_key, derive_wallet_keychain};
use super::types::Wallet;

/// Type alias for the hmac core implementation
type HmacSha256 = hmac::Hmac<Sha256>;

/// A type representing a symmetric HMAC key
#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct HmacKey(pub [u8; 32]);
impl HmacKey {
    /// Create a new HMAC key from a hex string
    pub fn new(hex: &str) -> Result<Self, JsError> {
        Self::from_hex_string(hex)
    }

    /// Get the inner bytes
    pub fn inner(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert the HMAC key to a hex string
    pub fn to_hex_string(&self) -> String {
        bytes_to_hex_string(&self.0)
    }

    /// Try to convert a hex string to an HMAC key
    pub fn from_hex_string(hex: &str) -> Result<Self, JsError> {
        let bytes = bytes_from_hex_string(hex)?;
        if bytes.len() != 32 {
            return Err(JsError::new(&format!(
                "expected 32 byte HMAC key, got {}",
                bytes.len()
            )));
        }

        let bytes_arr: [u8; 32] = bytes
            .try_into()
            .map_err(|_| JsError::new("Failed to convert bytes to array"))?;
        Ok(Self(bytes_arr))
    }

    /// Compute the HMAC of a message
    pub fn compute_mac(&self, msg: &[u8]) -> Vec<u8> {
        let mut hmac =
            HmacSha256::new_from_slice(self.inner()).expect("hmac can handle all slice lengths");
        hmac.update(msg);
        hmac.finalize().into_bytes().to_vec()
    }

    /// Verify the HMAC of a message
    pub fn verify_mac(&self, msg: &[u8], mac: &[u8]) -> bool {
        self.compute_mac(msg) == mac
    }
}

/// Represents the private keys a relayer has access to for a given wallet
#[derive(Clone, Debug, Derivative, Serialize, Deserialize)]
#[derivative(PartialEq, Eq)]
pub struct PrivateKeyChain {
    /// Optionally the relayer holds sk_root, in which case the relayer has
    /// heightened permissions than the standard case
    ///
    /// We call such a relayer a "super relayer"
    pub sk_root: Option<SecretSigningKey>,
    /// The match private key, authorizes the relayer to match orders for the
    /// wallet
    pub sk_match: SecretIdentificationKey,
    /// The symmetric HMAC key the user has registered with the relayer for API
    /// authentication
    pub symmetric_key: HmacKey,
}

impl PrivateKeyChain {
    /// Create a new private key chain from a match key and a root key
    pub fn new(
        sk_match: SecretIdentificationKey,
        sk_root: Option<SecretSigningKey>,
        symmetric_key: HmacKey,
    ) -> Self {
        Self {
            sk_match,
            sk_root,
            symmetric_key,
        }
    }

    /// Create a new private key chain without the root key
    pub fn new_without_root(sk_match: SecretIdentificationKey, symmetric_key: HmacKey) -> Self {
        Self {
            sk_match,
            sk_root: None,
            symmetric_key,
        }
    }
}

/// Represents the public and private keys given to the relayer managing a
/// wallet
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct KeyChain {
    /// The public keys in the wallet
    pub public_keys: PublicKeyChain,
    /// The secret keys in the wallet
    pub secret_keys: PrivateKeyChain,
}

impl KeyChain {
    /// Increment the keychain nonce
    pub fn increment_nonce(&mut self) {
        self.public_keys.nonce += Scalar::one();
    }

    /// Get the public root key
    pub fn pk_root(&self) -> PublicSigningKey {
        self.public_keys.pk_root.clone()
    }

    /// Set the public root key
    pub fn set_pk_root(&mut self, pk_root: PublicSigningKey) {
        self.public_keys.pk_root = pk_root;
    }

    /// Get the public match key
    pub fn pk_match(&self) -> PublicIdentificationKey {
        self.public_keys.pk_match
    }

    /// Get the secret root key
    pub fn sk_root(&self) -> Option<SecretSigningKey> {
        self.secret_keys.sk_root.clone()
    }

    /// Get the secret match key
    pub fn sk_match(&self) -> SecretIdentificationKey {
        self.secret_keys.sk_match
    }

    /// Get the symmetric key
    pub fn symmetric_key(&self) -> HmacKey {
        self.secret_keys.symmetric_key
    }

    /// Get the next rotated keychain's public key without modifying the current keychain
    pub fn get_next_rotated_public_key(&self, seed: &str) -> Result<PublicSigningKey, JsError> {
        let next_nonce = self.public_keys.nonce + Scalar::one();
        let sk_root = derive_sk_root_signing_key(seed, Some(&next_nonce))?;
        let rotated_keychain = derive_wallet_keychain(&sk_root)?;
        Ok(rotated_keychain.public_keys.pk_root)
    }

    // Rotate the keychain by incrementing the nonce and re-deriving the keys
    pub fn rotate(&mut self, seed: &str) -> Result<(), JsError> {
        self.increment_nonce();
        let nonce = self.public_keys.nonce;

        let sk_root = derive_sk_root_signing_key(seed, Some(&nonce))?;
        let rotated_keychain = derive_wallet_keychain(&sk_root)?;
        self.set_pk_root(rotated_keychain.public_keys.pk_root);
        self.secret_keys.sk_root = rotated_keychain.secret_keys.sk_root;
        Ok(())
    }
}

/// Error message emitted when the wallet does not have an `sk_root` value
const ERR_NO_SK_ROOT: &str = "wallet does not have an `sk_root` value";

impl Wallet {
    /// Sign a wallet transition commitment with the wallet's keychain
    ///
    /// The contracts expect a recoverable signature with the recover ID set to
    /// 0/1; we use ethers `sign_prehash_recoverable` to generate this signature
    pub fn sign_commitment(&self, commitment: Scalar) -> Result<Signature, JsError> {
        // Fetch the `sk_root` key
        let root_key = self
            .key_chain
            .secret_keys
            .sk_root
            .as_ref()
            .ok_or(JsError::new(ERR_NO_SK_ROOT))?;
        let key = EthersSigningKey::try_from(root_key)?;

        // Hash the message and sign it
        let comm_bytes = commitment.inner().serialize_to_bytes();
        let digest = keccak256(comm_bytes);
        let (sig, recovery_id) = key
            .sign_prehash_recoverable(&digest)
            .map_err(map_js_error!("failed to sign commitment: {}"))?;

        Ok(Signature {
            r: U256::from_big_endian(&sig.r().to_bytes()),
            s: U256::from_big_endian(&sig.s().to_bytes()),
            v: recovery_id.to_byte() as u64,
        })
    }
}
