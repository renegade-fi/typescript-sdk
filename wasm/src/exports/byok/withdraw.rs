use js_sys::Function;
use wasm_bindgen::prelude::*;

use crate::{
    exports::{
        byok::{
            generate_signature, key_rotation::handle_key_rotation, parameters::WithdrawParameters,
            signature::authorize_withdrawal,
        },
        error::Error,
        helpers::deserialize_wallet,
    },
    external_api::wallet::{WalletUpdateAuthorization, WithdrawBalanceRequest},
    serialize_to_js,
};

#[wasm_bindgen]
pub async fn byok_withdraw(
    wallet_str: &str,
    sign_message: &Function,
    public_key: &str,
    mint: &str,
    amount: &str,
    destination_addr: &str,
) -> Result<JsValue, JsError> {
    let params = WithdrawParameters::new(mint, amount, destination_addr)?;

    let amount_u128 = params.amount_as_u128()?;

    let mut wallet = deserialize_wallet(wallet_str)?;
    handle_key_rotation(&mut wallet, &public_key)?;

    // Process withdrawal
    wallet
        .withdraw(&params.mint, amount_u128)
        .map_err(Error::wallet_mutation)?;
    wallet.reblind_wallet();

    // Generate signature for the wallet update
    let sig = generate_signature(&wallet, sign_message).await?;

    let withdrawal_sig = authorize_withdrawal(
        sign_message,
        params.mint,
        amount_u128,
        params.destination_addr.clone(),
    )
    .await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig: sig,
        new_root_key: Some(public_key.to_string()),
    };

    let request = WithdrawBalanceRequest {
        amount: params.amount,
        destination_addr: params.destination_addr,
        external_transfer_sig: withdrawal_sig.to_vec(),
        update_auth,
    };

    serialize_to_js!(request)
}
