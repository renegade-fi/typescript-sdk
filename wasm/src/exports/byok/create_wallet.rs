use wasm_bindgen::prelude::*;

use crate::{
    common::types::Wallet, exports::byok::parameters::CreateWalletParameters,
    external_api::wallet::CreateWalletRequest, serialize_to_js, types::scalar_to_biguint,
};

#[wasm_bindgen]
pub async fn byok_create_wallet(
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
    );

    let request = CreateWalletRequest {
        wallet: wallet.into(),
        blinder_seed: scalar_to_biguint(&params.blinder_seed),
    };

    serialize_to_js!(request)
}
