use js_sys::Function;
use num_traits::ToPrimitive;
use wasm_bindgen::prelude::*;

use crate::{
    circuit_types::balance::Balance,
    exports::{
        byok::{
            generate_signature, key_rotation::handle_key_rotation, parameters::DepositParameters,
        },
        error::WasmError,
        helpers::deserialize_wallet,
    },
    external_api::wallet::{DepositBalanceRequest, WalletUpdateAuthorization},
    serialize_to_js,
};

#[wasm_bindgen]
pub async fn byok_deposit(
    wallet_str: &str,
    sign_message: &Function,
    public_key: &str,
    from_addr: &str,
    mint: &str,
    amount: &str,
    permit_nonce: &str,
    permit_deadline: &str,
    permit_signature: &str,
) -> Result<JsValue, JsError> {
    let params = DepositParameters::new(
        public_key,
        from_addr,
        mint,
        amount,
        permit_nonce,
        permit_deadline,
        permit_signature,
    )?;
    let amount = params.amount.to_u128().ok_or_else(|| {
        WasmError::InvalidParameter(format!("Could not convert {} to u128", params.amount))
    })?;

    let mut wallet = deserialize_wallet(wallet_str)?;
    handle_key_rotation(&mut wallet, &params.public_key)?;

    let balance = Balance::new_from_mint_and_amount(params.mint.clone(), amount);
    wallet
        .add_balance(balance)
        .map_err(WasmError::WalletMutation)?;
    wallet.reblind_wallet();

    let sig = generate_signature(&wallet, sign_message).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig: sig,
        new_root_key: Some(params.public_key),
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
