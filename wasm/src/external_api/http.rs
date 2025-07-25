#![allow(clippy::too_many_arguments)]

use std::str::FromStr;

use super::types::{
    ApiOrder, ApiOrderType, ApiPrivateKeychain, ApiWallet, SignedExternalQuote,
    SponsoredQuoteResponse,
};
use crate::{
    circuit_types::{balance::Balance, fixed_point::FixedPoint, order::OrderSide, Amount},
    common::{
        derivation::{
            derive_blinder_seed, derive_sk_root_signing_key, derive_wallet_from_key,
            derive_wallet_id,
        },
        types::{Chain, WalletIdentifier},
    },
    helpers::{
        biguint_from_hex_string, deserialize_biguint_from_hex_string, deserialize_wallet,
        serialize_biguint_to_hex_string, PoseidonCSPRNG,
    },
    key_rotation::handle_key_rotation,
    map_js_error,
    signature::{sign_wallet_commitment, sign_withdrawal_authorization},
};
use ethers::types::Bytes;
use itertools::Itertools;
use js_sys::Function;
use num_bigint::BigUint;
use num_traits::ToPrimitive;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use wasm_bindgen::prelude::*;

/// Error message displayed when a given order cannot be found
const ERR_ORDER_NOT_FOUND: &str = "order not found";

/// The type encapsulating a wallet update's authorization parameters
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WalletUpdateAuthorization {
    /// A signature of the circuit statement used in the proof of
    /// VALID WALLET UPDATE by `sk_root`. This allows the contract
    /// to guarantee that the wallet updates are properly authorized
    pub statement_sig: Vec<u8>,
    /// The new public root key to rotate to if desired by the client
    ///
    /// Hex encoded
    pub new_root_key: Option<String>,
}

/// The request type to create a new wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateWalletRequest {
    /// The wallet info to be created
    pub wallet: ApiWallet,
    /// The seed for the wallet's blinder CSPRNG
    pub blinder_seed: BigUint,
}

#[wasm_bindgen]
pub fn create_wallet(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let (mut wallet, blinder_seed, _) = derive_wallet_from_key(&sk_root)?;
    wallet.key_chain.private_keys.delete_sk_root();
    let req = CreateWalletRequest {
        wallet,
        blinder_seed: blinder_seed.to_biguint(),
    };

    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type to find a wallet in contract storage and begin managing it
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FindWalletRequest {
    /// The ID to handle the wallet by
    pub wallet_id: WalletIdentifier,
    /// The seed for the wallet's blinder CSPRNG
    pub blinder_seed: BigUint,
    /// The seed for the wallet's secret share CSPRNG
    pub secret_share_seed: BigUint,
    /// The private keychain to use for management after the wallet is found
    pub private_keychain: ApiPrivateKeychain,
}

#[wasm_bindgen]
pub fn find_wallet(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let (mut wallet, blinder_seed, share_seed) = derive_wallet_from_key(&sk_root)?;
    wallet.key_chain.private_keys.delete_sk_root();
    let req = FindWalletRequest {
        wallet_id: wallet.id,
        blinder_seed: blinder_seed.to_biguint(),
        secret_share_seed: share_seed.to_biguint(),
        // TODO: Remove sk_root
        private_keychain: wallet.key_chain.private_keys,
    };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

#[wasm_bindgen]
pub fn derive_blinder_share(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let blinder_seed = derive_blinder_seed(&sk_root)?;
    let mut blinder_csprng = PoseidonCSPRNG::new(blinder_seed);
    let (blinder, blinder_private) = blinder_csprng
        .next_tuple()
        .ok_or(JsError::new("Failed to generate blinder tuple"))?;
    let blinder_share = blinder - blinder_private;
    Ok(JsValue::from_str(&blinder_share.to_biguint().to_string()))
}

#[wasm_bindgen]
pub fn wallet_id(seed: &str) -> Result<JsValue, JsError> {
    let sk_root = derive_sk_root_signing_key(seed, None)?;
    let wallet_id = derive_wallet_id(&sk_root)?;
    Ok(JsValue::from_str(&wallet_id.to_string()))
}

/// The request type to deposit a balance into the darkpool
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DepositBalanceRequest {
    /// The arbitrum account contract address to send the balance from
    #[serde(
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub from_addr: BigUint,
    /// The mint (ERC-20 contract address) of the token to deposit
    #[serde(
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub mint: BigUint,
    /// The amount of the token to deposit
    pub amount: BigUint,
    /// The update authorization parameters
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
    /// The nonce used in the associated Permit2 permit
    pub permit_nonce: BigUint,
    /// The deadline used in the associated Permit2 permit
    pub permit_deadline: BigUint,
    /// The signature over the associated Permit2 permit, allowing
    /// the contract to guarantee that the deposit is sourced from
    /// the correct account
    pub permit_signature: Vec<u8>,
}

#[wasm_bindgen]
pub async fn deposit(
    seed: Option<String>,
    wallet_str: &str,
    from_addr: &str,
    mint: &str,
    amount: &str,
    permit_nonce: &str,
    permit_deadline: &str,
    permit_signature: &str,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str)?;

    let (next_public_key, signing_key) =
        handle_key_rotation(&mut new_wallet, seed.as_deref(), new_public_key)?;

    // Modify the wallet
    let mint = biguint_from_hex_string(mint)?;
    let amount = biguint_from_hex_string(amount)?;
    new_wallet.add_balance(Balance::new_from_mint_and_amount(
        mint.clone(),
        amount
            .to_u128()
            .ok_or_else(|| JsError::new("Amount too large for u128"))?,
    ))?;
    new_wallet.reblind_wallet()?;

    // Sign a commitment to the new shares
    let statement_sig =
        sign_wallet_commitment(&new_wallet, signing_key.as_ref(), sign_message.as_ref()).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig,
        new_root_key: next_public_key,
    };

    let req = DepositBalanceRequest {
        from_addr: biguint_from_hex_string(from_addr)?,
        mint,
        amount,
        update_auth,
        permit_nonce: biguint_from_hex_string(permit_nonce)?,
        permit_deadline: biguint_from_hex_string(permit_deadline)?,
        permit_signature: biguint_from_hex_string(permit_signature)?.to_bytes_be(),
    };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type to withdraw a balance from the Darkpool
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WithdrawBalanceRequest {
    /// The destination address to withdraw the balance to
    #[serde(
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub destination_addr: BigUint,
    /// The amount of the token to withdraw
    pub amount: BigUint,
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
    /// A signature over the external transfer, allowing the contract
    /// to guarantee that the withdrawal is directed at the correct
    /// recipient
    pub external_transfer_sig: Vec<u8>,
}

#[wasm_bindgen]
pub async fn withdraw(
    chain: &str,
    seed: Option<String>,
    wallet_str: &str,
    mint: &str,
    amount: &str,
    destination_addr: &str,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str)?;

    let (next_public_key, signing_key) =
        handle_key_rotation(&mut new_wallet, seed.as_deref(), new_public_key)?;

    // Modify the wallet
    let mint = biguint_from_hex_string(mint)?;
    let amount = biguint_from_hex_string(amount)?;
    let destination_addr = biguint_from_hex_string(destination_addr)?;

    for (mint, balance) in new_wallet.balances.clone() {
        if balance.relayer_fee_balance > 0 {
            new_wallet
                .get_balance_mut(&mint)
                .ok_or_else(|| JsError::new("Balance not found"))?
                .relayer_fee_balance = 0;
            new_wallet.reblind_wallet()?;
        }

        if balance.protocol_fee_balance > 0 {
            new_wallet
                .get_balance_mut(&mint)
                .ok_or_else(|| JsError::new("Balance not found"))?
                .protocol_fee_balance = 0;
            new_wallet.reblind_wallet()?;
        }
    }

    new_wallet.withdraw(
        &mint,
        amount
            .to_u128()
            .ok_or_else(|| JsError::new("Amount too large for u128"))?,
    )?;
    new_wallet.reblind_wallet()?;

    // Sign a commitment to the new shares
    let statement_sig =
        sign_wallet_commitment(&new_wallet, signing_key.as_ref(), sign_message.as_ref()).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig,
        new_root_key: next_public_key,
    };

    let chain = Chain::from_str(chain)?;

    let withdrawal_sig = sign_withdrawal_authorization(
        &chain,
        signing_key.as_ref(),
        mint.clone(),
        amount
            .to_u128()
            .ok_or_else(|| JsError::new("Amount too large for u128"))?,
        destination_addr.clone(),
        sign_message.as_ref(),
    )
    .await?;

    let req = WithdrawBalanceRequest {
        amount,
        destination_addr,
        external_transfer_sig: withdrawal_sig,
        update_auth,
    };

    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// Serializes a calldata element for a contract call
pub fn serialize_calldata<T: Serialize>(t: &T) -> Result<Bytes, JsError> {
    Ok(postcard::to_allocvec(t)?.into())
}

/// The request type to add a new order to a given wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    /// The order to be created
    pub order: ApiOrder,
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
}

/// The request type to add a new order to a given wallet, within a non-global
/// matching pool
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateOrderInMatchingPoolRequest {
    /// The order to be created
    pub order: ApiOrder,
    /// The update authorization
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
    /// The matching pool to create the order in
    pub matching_pool: String,
}

/// Create an order type from the args
fn create_order(
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
) -> Result<ApiOrder, JsError> {
    // Parse the UUID from the string, or generate a new one if the string is empty
    let id = if id.is_empty() {
        Uuid::new_v4()
    } else {
        Uuid::parse_str(id).map_err(map_js_error!("Invalid UUID: {}"))?
    };

    // Convert the side string to OrderSide enum
    let side = match side.to_lowercase().as_str() {
        "sell" => OrderSide::Sell,
        "buy" => OrderSide::Buy,
        _ => return Err(JsError::new("Invalid order side")),
    };

    let amount = biguint_from_hex_string(amount)?
        .to_u128()
        .ok_or_else(|| JsError::new("Amount too large for u128"))?;

    let min_fill_size = biguint_from_hex_string(min_fill_size)?
        .to_u128()
        .ok_or_else(|| JsError::new("Min fill size too large for u128"))?;

    let worst_case_price = if worst_case_price.is_empty() {
        match side {
            OrderSide::Sell => FixedPoint::from_integer(0),
            OrderSide::Buy => FixedPoint::from_integer(u64::MAX),
        }
    } else {
        worst_case_price
            .parse::<f64>()
            .map_err(map_js_error!("Invalid worst_case_price: {}"))?;
        FixedPoint::from_f64_round_down(
            worst_case_price
                .parse::<f64>()
                .map_err(map_js_error!("Invalid worst_case_price: {}"))?,
        )?
    };

    Ok(ApiOrder {
        id,
        base_mint: biguint_from_hex_string(base_mint)?,
        quote_mint: biguint_from_hex_string(quote_mint)?,
        side,
        amount,
        worst_case_price,
        type_: ApiOrderType::Midpoint,
        min_fill_size,
        allow_external_matches,
    })
}

pub async fn create_order_request(
    seed: Option<String>,
    wallet_str: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<CreateOrderRequest, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str)?;

    let (next_public_key, signing_key) =
        handle_key_rotation(&mut new_wallet, seed.as_deref(), new_public_key)?;

    let order = create_order(
        id,
        base_mint,
        quote_mint,
        side,
        amount,
        worst_case_price,
        min_fill_size,
        allow_external_matches,
    )?;

    // Modify the wallet
    new_wallet.add_order(order.id, order.clone().into())?;
    new_wallet.reblind_wallet()?;

    // Sign a commitment to the new shares
    let statement_sig =
        sign_wallet_commitment(&new_wallet, signing_key.as_ref(), sign_message.as_ref()).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig,
        new_root_key: next_public_key,
    };

    Ok(CreateOrderRequest { order, update_auth })
}

#[wasm_bindgen]
pub async fn new_order(
    seed: Option<String>,
    wallet_str: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let req = create_order_request(
        seed,
        wallet_str,
        id,
        base_mint,
        quote_mint,
        side,
        amount,
        worst_case_price,
        min_fill_size,
        allow_external_matches,
        new_public_key,
        sign_message,
    )
    .await?;
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

#[wasm_bindgen]
pub async fn new_order_in_matching_pool(
    seed: Option<String>,
    wallet_str: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
    matching_pool: &str,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let create_order_req = create_order_request(
        seed,
        wallet_str,
        id,
        base_mint,
        quote_mint,
        side,
        amount,
        worst_case_price,
        min_fill_size,
        allow_external_matches,
        new_public_key,
        sign_message,
    )
    .await?;
    let req = CreateOrderInMatchingPoolRequest {
        order: create_order_req.order,
        update_auth: create_order_req.update_auth,
        matching_pool: matching_pool.to_string(),
    };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type to cancel a given order
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CancelOrderRequest {
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
}

#[wasm_bindgen]
pub async fn cancel_order(
    seed: Option<String>,
    wallet_str: &str,
    order_id: &str,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str)?;

    let (next_public_key, signing_key) =
        handle_key_rotation(&mut new_wallet, seed.as_deref(), new_public_key)?;

    let order_id = Uuid::parse_str(order_id).map_err(map_js_error!("Invalid UUID: {}"))?;

    // Modify the wallet
    new_wallet
        .orders
        .remove(&order_id)
        .ok_or_else(|| JsError::new(ERR_ORDER_NOT_FOUND))?;

    new_wallet.reblind_wallet()?;

    // Sign a commitment to the new shares
    let statement_sig =
        sign_wallet_commitment(&new_wallet, signing_key.as_ref(), sign_message.as_ref()).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig,
        new_root_key: next_public_key,
    };

    let req = CancelOrderRequest { update_auth };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type to update an order
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateOrderRequest {
    /// The order to be updated
    pub order: ApiOrder,
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
}

#[wasm_bindgen]
pub async fn update_order(
    seed: Option<String>,
    wallet_str: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
    worst_case_price: &str,
    min_fill_size: &str,
    allow_external_matches: bool,
    new_public_key: Option<String>,
    sign_message: Option<Function>,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str)?;

    let (next_public_key, signing_key) =
        handle_key_rotation(&mut new_wallet, seed.as_deref(), new_public_key)?;

    let new_order = create_order(
        id,
        base_mint,
        quote_mint,
        side,
        amount,
        worst_case_price,
        min_fill_size,
        allow_external_matches,
    )?;

    // Modify the wallet
    // We edit the value of the underlying map in-place (as opposed to `pop` and
    // `insert`) to maintain ordering of the orders. This is important for
    // the circuit, which relies on the order of the orders to be consistent
    // between the old and new wallets
    let order = new_wallet
        .orders
        .get_mut(&new_order.id)
        .ok_or_else(|| JsError::new(ERR_ORDER_NOT_FOUND))?;
    *order = new_order.clone().into();
    new_wallet.reblind_wallet()?;

    // Sign a commitment to the new shares
    let statement_sig =
        sign_wallet_commitment(&new_wallet, signing_key.as_ref(), sign_message.as_ref()).await?;

    let update_auth = WalletUpdateAuthorization {
        statement_sig,
        new_root_key: next_public_key,
    };

    let req = UpdateOrderRequest {
        order: new_order,
        update_auth,
    };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type for requesting an external match
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExternalMatchRequest {
    /// Whether or not to include gas estimation in the response
    #[serde(default)]
    pub do_gas_estimation: bool,
    /// The receiver address of the match, if not the message sender
    #[serde(default)]
    pub receiver_address: Option<String>,
    /// The external order
    pub external_order: ExternalOrder,
}

/// An external order
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExternalOrder {
    /// The mint (erc20 address) of the quote token
    #[serde(
        alias = "quote",
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub quote_mint: BigUint,
    /// The mint (erc20 address) of the base token
    #[serde(
        alias = "base",
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub base_mint: BigUint,
    /// The side of the market this order is on
    pub side: OrderSide,
    /// The base amount of the order
    #[serde(default, alias = "amount", alias = "baseAmount")]
    pub base_amount: Amount,
    /// The quote amount of the order
    #[serde(default, alias = "quoteAmount")]
    pub quote_amount: Amount,
    /// The minimum fill size for the order
    #[serde(default)]
    pub min_fill_size: Amount,
}

#[wasm_bindgen]
pub fn new_external_order(
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    base_amount: &str,
    quote_amount: &str,
    min_fill_size: &str,
    do_gas_estimation: bool,
    receiver_address: &str,
) -> Result<JsValue, JsError> {
    let external_order = build_external_order(
        base_mint,
        quote_mint,
        side,
        base_amount,
        quote_amount,
        min_fill_size,
    )?;

    let receiver_address = if receiver_address.is_empty() {
        None
    } else {
        Some(receiver_address.to_string())
    };

    let req = ExternalMatchRequest {
        do_gas_estimation,
        receiver_address,
        external_order,
    };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type for requesting an external match quote
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExternalQuoteRequest {
    /// The external order
    pub external_order: ExternalOrder,
}

#[wasm_bindgen]
pub fn new_external_quote_request(
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    base_amount: &str,
    quote_amount: &str,
    min_fill_size: &str,
) -> Result<JsValue, JsError> {
    let external_order = build_external_order(
        base_mint,
        quote_mint,
        side,
        base_amount,
        quote_amount,
        min_fill_size,
    )?;

    let req = ExternalQuoteRequest { external_order };
    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

/// The request type for assembling an external match, potentially with gas sponsorship
#[derive(Clone, Serialize, Deserialize)]
pub struct AssembleExternalMatchRequest {
    /// Whether or not to include gas estimation in the response
    #[serde(default)]
    pub do_gas_estimation: bool,
    /// Whether or not to allow shared access to the resulting bundle
    ///
    /// If true, the bundle may be sent to other clients requesting an external
    /// match. If false, the bundle will be exclusively held for some time
    #[serde(default)]
    pub allow_shared: bool,
    /// The signed external match quote
    pub signed_quote: SignedExternalQuote,
    /// The receiver address of the match, if not the message sender
    #[serde(default)]
    pub receiver_address: Option<String>,
    /// The updated order
    #[serde(default)]
    pub updated_order: Option<ExternalOrder>,
}

#[wasm_bindgen]
pub fn assemble_external_match(
    do_gas_estimation: bool,
    allow_shared: bool,
    updated_order: &str,
    sponsored_quote_response: &str,
    receiver_address: &str,
) -> Result<JsValue, JsError> {
    // Parse the updated order if it exists
    let updated_order = if updated_order.is_empty() {
        None
    } else {
        Some(
            serde_json::from_str(updated_order)
                .map_err(map_js_error!("Failed to parse updated order: {}"))?,
        )
    };

    let receiver_address = if receiver_address.is_empty() {
        None
    } else {
        Some(receiver_address.to_string())
    };

    let SponsoredQuoteResponse {
        quote, signature, ..
    } = serde_json::from_str(sponsored_quote_response).map_err(map_js_error!(
        "Failed to parse sponsored quote response: {}"
    ))?;

    let signed_quote = SignedExternalQuote { quote, signature };

    let req = AssembleExternalMatchRequest {
        do_gas_estimation,
        allow_shared,
        receiver_address,
        updated_order,
        signed_quote,
    };

    let serialized =
        serde_json::to_string(&req).map_err(map_js_error!("Failed to serialize request: {}"))?;
    Ok(JsValue::from_str(&serialized))
}

fn build_external_order(
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    base_amount: &str,
    quote_amount: &str,
    min_fill_size: &str,
) -> Result<ExternalOrder, JsError> {
    let side = match side.to_lowercase().as_str() {
        "sell" => OrderSide::Sell,
        "buy" => OrderSide::Buy,
        _ => return Err(JsError::new("Invalid order side")),
    };
    let base_amount = biguint_from_hex_string(base_amount)?
        .to_u128()
        .ok_or_else(|| JsError::new("Base amount too large for u128"))?;
    let quote_amount = biguint_from_hex_string(quote_amount)?
        .to_u128()
        .ok_or_else(|| JsError::new("Quote amount too large for u128"))?;

    let min_fill_size = biguint_from_hex_string(min_fill_size)?
        .to_u128()
        .ok_or_else(|| JsError::new("Min fill size too large for u128"))?;
    Ok(ExternalOrder {
        base_mint: biguint_from_hex_string(base_mint)?,
        quote_mint: biguint_from_hex_string(quote_mint)?,
        side,
        base_amount,
        quote_amount,
        min_fill_size,
    })
}
