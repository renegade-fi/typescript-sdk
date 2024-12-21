use js_sys::Function;
use wasm_bindgen::prelude::*;

use crate::{
    exports::{
        byok::{
            generate_signature, key_rotation::handle_key_rotation,
            parameters::CancelOrderParameters,
        },
        helpers::deserialize_wallet,
    },
    external_api::wallet::{CancelOrderRequest, WalletUpdateAuthorization},
    serialize_to_js,
};

#[wasm_bindgen]
pub async fn byok_cancel_order(
    wallet_str: &str,
    sign_message: &Function,
    public_key: &str,
    id: &str,
) -> Result<JsValue, JsError> {
    let params = CancelOrderParameters::new(id)?;

    let mut wallet = deserialize_wallet(wallet_str)?;
    handle_key_rotation(&mut wallet, &public_key)?;

    wallet.remove_order(&params.id);
    wallet.reblind_wallet();

    let sig = generate_signature(&wallet, sign_message).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig: sig,
        new_root_key: Some(public_key.to_string()),
    };

    let request = CancelOrderRequest { update_auth };

    serialize_to_js!(request)
}
