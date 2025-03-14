use js_sys::Function;
use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::circuit_types::keychain::SecretIdentificationKey;
use crate::common::derivation::derive_blinder_seed_external;
use crate::common::derivation::derive_share_seed_external;
use crate::common::derivation::derive_sk_match_external;
use crate::common::derivation::derive_symmetric_key_external;
use crate::common::derivation::derive_wallet_id_external;
use crate::serialize_to_js;
use crate::{
    circuit_types::scalar_to_hex_string,
    common::{keychain::HmacKey, types::WalletIdentifier},
    types::Scalar,
};

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

#[wasm_bindgen]
pub async fn generate_wallet_secrets(sign_message: &Function) -> Result<JsValue, JsError> {
    let wallet_id = derive_wallet_id_external(sign_message)
        .await
        .map_err(|e| JsError::new(&e.to_string()))?;
    let blinder_seed = derive_blinder_seed_external(sign_message)
        .await
        .map_err(|e| JsError::new(&e.to_string()))?;
    let share_seed = derive_share_seed_external(sign_message)
        .await
        .map_err(|e| JsError::new(&e.to_string()))?;

    let sk_match = derive_sk_match_external(sign_message)
        .await
        .map_err(|e| JsError::new(&e.to_string()))?;
    let sk_match = SecretIdentificationKey::from(sk_match);

    let symmetric_key = derive_symmetric_key_external(sign_message)
        .await
        .map_err(|e| JsError::new(&e.to_string()))?;

    let res = GeneratedSecrets {
        wallet_id,
        blinder_seed,
        share_seed,
        symmetric_key,
        sk_match,
    };

    serialize_to_js!(res)
}
