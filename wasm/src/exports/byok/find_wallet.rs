use wasm_bindgen::prelude::*;

use crate::{
    exports::byok::parameters::FindWalletParameters, external_api::wallet::FindWalletRequest,
    serialize_to_js, types::scalar_to_biguint,
};

#[wasm_bindgen]
pub async fn byok_find_wallet(
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
        blinder_seed: scalar_to_biguint(&params.blinder_seed),
        secret_share_seed: scalar_to_biguint(&params.share_seed),
        private_keychain: params.key_chain.private_keys,
    };

    serialize_to_js!(request)
}
