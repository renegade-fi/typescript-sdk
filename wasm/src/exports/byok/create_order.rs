use js_sys::Function;
use wasm_bindgen::prelude::*;

use crate::{
    exports::{
        byok::{
            generate_signature, key_rotation::handle_key_rotation,
            parameters::CreateOrderParameters,
        },
        error::Error,
        helpers::deserialize_wallet,
    },
    external_api::types::ApiOrder,
    external_api::wallet::{CreateOrderRequest, WalletUpdateAuthorization},
    serialize_to_js,
};

#[wasm_bindgen]
pub async fn byok_create_order(
    wallet_str: &str,
    sign_message: &Function,
    public_key: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
) -> Result<JsValue, JsError> {
    let params = CreateOrderParameters::new(
        id,
        base_mint,
        quote_mint,
        side,
        amount,
        worst_case_price,
        min_fill_size,
        allow_external_matches,
    )?;

    let mut wallet = deserialize_wallet(wallet_str)?;
    handle_key_rotation(&mut wallet, &public_key)?;

    let amount_u128 = params.amount_as_u128()?;
    let min_fill_size_u128 = params.min_fill_size_as_u128()?;

    let order = ApiOrder {
        id: params.id,
        base_mint: params.base_mint,
        quote_mint: params.quote_mint,
        side: params.side,
        amount: amount_u128,
        worst_case_price: params.worst_case_price,
        type_: crate::external_api::types::ApiOrderType::Midpoint,
        min_fill_size: min_fill_size_u128,
        allow_external_matches: params.allow_external_matches,
    };

    wallet
        .add_order(order.id, order.clone().into())
        .map_err(Error::wallet_mutation)?;
    wallet.reblind_wallet();

    let sig = generate_signature(&wallet, sign_message).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig: sig,
        new_root_key: Some(public_key.to_string()),
    };

    let request = CreateOrderRequest { order, update_auth };

    serialize_to_js!(request)
}
