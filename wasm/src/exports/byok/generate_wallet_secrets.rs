use js_sys::Function;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use crate::circuit_types::keychain::SecretIdentificationKey;
use crate::exports::byok::parameters::wallet::GeneratedSecrets;
use crate::exports::byok::utils::derivation::{
    derive_blinder_seed, derive_share_seed, derive_sk_match, derive_symmetric_key, derive_wallet_id,
};
use crate::serialize_to_js;

#[wasm_bindgen]
pub async fn generate_wallet_secrets(sign_message: &Function) -> Result<JsValue, JsError> {
    let wallet_id = derive_wallet_id(sign_message).await?;
    let blinder_seed = derive_blinder_seed(sign_message).await?;
    let share_seed = derive_share_seed(sign_message).await?;

    let sk_match = derive_sk_match(sign_message).await?;
    let sk_match = SecretIdentificationKey::from(sk_match);

    let symmetric_key = derive_symmetric_key(sign_message).await?;

    let res = GeneratedSecrets {
        wallet_id,
        blinder_seed,
        share_seed,
        symmetric_key,
        sk_match,
    };

    serialize_to_js!(res)
}
