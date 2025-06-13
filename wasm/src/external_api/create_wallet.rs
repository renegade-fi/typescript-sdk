use wasm_bindgen::prelude::*;

use crate::{
    common::types::Wallet, external_api::http::CreateWalletRequest, map_js_error, serialize_to_js,
    types::scalar_to_biguint,
};
use uuid::Uuid;

use crate::{
    circuit_types::keychain::{PublicKeyChain, PublicSigningKey, SecretIdentificationKey},
    common::keychain::{HmacKey, KeyChain, PrivateKeyChain},
    helpers::{biguint_from_hex_string, bytes_from_hex_string},
    types::Scalar,
};

#[wasm_bindgen]
pub async fn create_external_wallet(
    wallet_id: &str,
    blinder_seed: &str,
    share_seed: &str,
    pk_root: &str,
    sk_match: &str,
    symmetric_key: &str,
) -> Result<JsValue, JsError> {
    let params = CreateWalletParameters::new(
        wallet_id,
        blinder_seed,
        share_seed,
        pk_root,
        sk_match,
        symmetric_key,
    )?;

    let wallet = Wallet::new_empty_wallet(
        params.wallet_id,
        params.blinder_seed,
        params.share_seed,
        params.key_chain,
    )?;

    let api_wallet = wallet.try_into()?;
    let request = CreateWalletRequest {
        wallet: api_wallet,
        blinder_seed: scalar_to_biguint(&params.blinder_seed),
    };

    serialize_to_js!(request)
}

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
    ) -> Result<Self, JsError> {
        // Wallet seed info
        let wallet_id = Uuid::parse_str(wallet_id).map_err(map_js_error!("wallet_id: {}"))?;
        let blinder_seed_bigint = biguint_from_hex_string(blinder_seed)?;
        let blinder_seed = Scalar::from(blinder_seed_bigint);
        let share_seed_bigint = biguint_from_hex_string(share_seed)?;
        let share_seed = Scalar::from(share_seed_bigint);

        // KeyChain
        let sk_match_bigint = biguint_from_hex_string(sk_match)?;
        let sk_match_scalar = Scalar::from(sk_match_bigint);
        let sk_match = SecretIdentificationKey::from(sk_match_scalar);
        let pk_match = sk_match.get_public_key();
        let pk_root_bytes = bytes_from_hex_string(pk_root)?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)?;
        let symmetric_key = HmacKey::from_hex_string(symmetric_key)?;
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
