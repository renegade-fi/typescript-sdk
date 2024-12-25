use num_bigint::BigUint;
use uuid::Uuid;
use wasm_bindgen::prelude::*;

use crate::{
    circuit_types::keychain::{PublicKeyChain, PublicSigningKey, SecretIdentificationKey},
    common::keychain::{HmacKey, KeyChain, PrivateKeyChain},
    external_api::http::FindWalletRequest,
    helpers::{biguint_from_hex_string, bytes_from_hex_string},
    js_error, serialize_to_js,
    types::Scalar,
};

use super::types::ApiKeychain;

#[wasm_bindgen]
pub async fn find_external_wallet(
    wallet_id: &str,
    blinder_seed: &str,
    share_seed: &str,
    pk_root: &str,
    sk_match: &str,
    symmetric_key: &str,
) -> Result<JsValue, JsError> {
    let params = FindWalletParameters::new(
        wallet_id,
        blinder_seed,
        share_seed,
        pk_root,
        sk_match,
        symmetric_key,
    )?;

    let request = FindWalletRequest {
        wallet_id: params.wallet_id,
        blinder_seed: params.blinder_seed,
        secret_share_seed: params.share_seed,
        private_keychain: params.key_chain.private_keys,
    };

    serialize_to_js!(request)
}
pub struct FindWalletParameters {
    pub wallet_id: Uuid,
    pub blinder_seed: BigUint,
    pub share_seed: BigUint,
    pub key_chain: ApiKeychain,
}

impl FindWalletParameters {
    pub fn new(
        wallet_id: &str,
        blinder_seed: &str,
        share_seed: &str,
        pk_root: &str,
        sk_match: &str,
        symmetric_key: &str,
    ) -> Result<Self, JsError> {
        // Wallet seed info
        let wallet_id = Uuid::parse_str(wallet_id).map_err(|e| js_error!("wallet_id: {}", e))?;
        let blinder_seed =
            biguint_from_hex_string(blinder_seed).map_err(|e| js_error!("blinder_seed: {}", e))?;
        let share_seed =
            biguint_from_hex_string(share_seed).map_err(|e| js_error!("share_seed: {}", e))?;

        // KeyChain
        let sk_match_bigint =
            biguint_from_hex_string(sk_match).map_err(|e| js_error!("sk_match: {}", e))?;
        let sk_match_scalar = Scalar::from(sk_match_bigint);
        let sk_match = SecretIdentificationKey::from(sk_match_scalar);
        let pk_match = sk_match.get_public_key();
        let pk_root_bytes =
            bytes_from_hex_string(pk_root).map_err(|e| js_error!("pk_root: {}", e))?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)
            .map_err(|e| js_error!("pk_root: {}", e))?;
        let symmetric_key = HmacKey::from_hex_string(symmetric_key)
            .map_err(|e| js_error!("symmetric_key: {}", e))?;
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
            key_chain: key_chain.into(),
        })
    }
}
