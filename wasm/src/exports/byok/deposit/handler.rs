use js_sys::Function;
use num_traits::ToPrimitive;
use wasm_bindgen::prelude::*;

use crate::{
    circuit_types::balance::Balance,
    exports::{byok::signature::generate_statement_signature, helpers::deserialize_wallet},
    external_api::wallet::{DepositBalanceRequest, WalletUpdateAuthorization},
    serialize_to_js,
};

use super::{error::DepositError, parse::DepositParameters};

#[wasm_bindgen]
pub async fn byok_deposit(
    seed: &str,
    wallet_str: &str,
    sign_message: &Function,
    from_addr: &str,
    mint: &str,
    amount: &str,
    permit_nonce: &str,
    permit_deadline: &str,
    permit_signature: &str,
) -> Result<JsValue, JsError> {
    let params = DepositParameters::parse(
        from_addr,
        mint,
        amount,
        permit_nonce,
        permit_deadline,
        permit_signature,
    )?;
    let amount = params.amount.to_u128().ok_or_else(|| {
        DepositError::InvalidParameter(format!("Could not convert {} to u128", params.amount))
    })?;

    let mut wallet = deserialize_wallet(wallet_str)?;
    let balance = Balance::new_from_mint_and_amount(params.mint.clone(), amount);
    wallet
        .add_balance(balance)
        .map_err(DepositError::WalletMutation)?;
    wallet.reblind_wallet();

    // let signature = generate_signature(&wallet, sign_message).await?;
    let signature = generate_statement_signature(seed, &wallet).await?.to_vec();

    let update_auth = WalletUpdateAuthorization {
        statement_sig: signature,
        new_root_key: None,
    };

    let request = DepositBalanceRequest {
        from_addr: params.from_addr,
        mint: params.mint,
        amount: params.amount,
        update_auth,
        permit_nonce: params.permit_nonce,
        permit_deadline: params.permit_deadline,
        permit_signature: params.permit_signature,
    };

    serialize_to_js!(request)
}
