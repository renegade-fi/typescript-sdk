use serde::Serialize;
use uuid::Uuid;

use crate::{
    circuit_types::{
        keychain::{PublicKeyChain, PublicSigningKey, SecretIdentificationKey},
        scalar_to_hex_string,
    },
    common::{
        keychain::{HmacKey, KeyChain, PrivateKeyChain},
        types::WalletIdentifier,
    },
    exports::error::Error,
    helpers::{biguint_from_hex_string, bytes_from_hex_string},
    types::Scalar,
};

pub struct CreateWalletParameters {
    pub wallet_id: Uuid,
    pub blinder_seed: Scalar,
    pub share_seed: Scalar,
    pub key_chain: KeyChain,
}

impl CreateWalletParameters {
    pub fn new(
        wallet_id: &str,
        blinder_seed: &str,
        share_seed: &str,
        pk_root: &str,
        sk_match: &str,
        symmetric_key: &str,
    ) -> Result<Self, Error> {
        // Wallet seed info
        let wallet_id = Uuid::parse_str(wallet_id)
            .map_err(|e| Error::invalid_parameter(format!("wallet_id: {}", e)))?;
        let blinder_seed_bigint = biguint_from_hex_string(blinder_seed)
            .map_err(|e| Error::invalid_parameter(format!("blinder_seed: {}", e)))?;
        let blinder_seed = Scalar::from(blinder_seed_bigint);
        let share_seed_bigint = biguint_from_hex_string(share_seed)
            .map_err(|e| Error::invalid_parameter(format!("share_seed: {}", e)))?;
        let share_seed = Scalar::from(share_seed_bigint);

        // KeyChain
        let sk_match_bigint = biguint_from_hex_string(sk_match)
            .map_err(|e| Error::invalid_parameter(format!("sk_match: {}", e)))?;
        let sk_match_scalar = Scalar::from(sk_match_bigint);
        let sk_match = SecretIdentificationKey::from(sk_match_scalar);
        let pk_match = sk_match.get_public_key();
        let pk_root_bytes = bytes_from_hex_string(pk_root)
            .map_err(|e| Error::invalid_parameter(format!("pk_root: {}", e)))?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)
            .map_err(|e| Error::invalid_parameter(format!("pk_root: {}", e)))?;
        let symmetric_key = HmacKey::from_hex_string(symmetric_key)
            .map_err(|e| Error::invalid_parameter(format!("symmetric_key: {}", e)))?;
        let key_chain = KeyChain {
            public_keys: PublicKeyChain::new(pk_root, pk_match),
            secret_keys: PrivateKeyChain {
                sk_root: None,
                sk_match,
                symmetric_key,
            },
        };
        Ok(Self {
            wallet_id,
            blinder_seed,
            share_seed,
            key_chain,
        })
    }
}

pub struct GetPkRootParameters {
    pub pk_root: PublicSigningKey,
}

impl GetPkRootParameters {
    pub fn new(pk_root: &str) -> Result<Self, Error> {
        let pk_root_bytes = bytes_from_hex_string(pk_root)
            .map_err(|e| Error::invalid_parameter(format!("pk_root: {}", e)))?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)
            .map_err(|e| Error::invalid_parameter(format!("pk_root: {}", e)))?;

        Ok(Self { pk_root })
    }
}

fn serialize_hmac_key<S>(key: &HmacKey, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&key.to_hex_string())
}

#[derive(Serialize)]
pub struct GeneratedSecrets {
    #[serde(serialize_with = "serialize_wallet_id")]
    pub wallet_id: WalletIdentifier,
    #[serde(serialize_with = "scalar_to_hex_string")]
    pub blinder_seed: Scalar,
    #[serde(serialize_with = "scalar_to_hex_string")]
    pub share_seed: Scalar,
    #[serde(serialize_with = "serialize_hmac_key")]
    pub symmetric_key: HmacKey,
    pub sk_match: SecretIdentificationKey,
}

fn serialize_wallet_id<S>(wallet_id: &WalletIdentifier, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&wallet_id.to_string())
}
