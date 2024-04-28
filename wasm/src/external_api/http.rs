use super::types::{ApiKeychain, ApiOrder, ApiOrderType, ApiWallet};
use crate::{
    circuit_types::{
        balance::Balance,
        fixed_point::FixedPoint,
        order::OrderSide,
        transfers::{to_contract_external_transfer, ExternalTransfer, ExternalTransferDirection},
        Amount,
    },
    common::{
        derivation::{derive_blinder_seed, derive_wallet_from_key, derive_wallet_id, wrap_eyre},
        types::WalletIdentifier,
    },
    helpers::{
        biguint_from_hex_string, deserialize_biguint_from_hex_string, deserialize_wallet,
        hex_to_signing_key, serialize_biguint_to_hex_string, PoseidonCSPRNG,
    },
};
use base64::engine::{general_purpose as b64_general_purpose, Engine};
use ethers::{
    types::{Bytes, Signature, U256},
    utils::keccak256,
};
use itertools::Itertools;
use k256::ecdsa::{signature::Signer, Signature as K256Signature, SigningKey};
use num_bigint::BigUint;
use num_traits::ToPrimitive;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use wasm_bindgen::prelude::*;
use web_sys::console;

/// The amount of buffer time to add to the signature expiration
const SIG_EXPIRATION_BUFFER_MS: u64 = 10_000; // 5 seconds

/// The request type to create a new wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateWalletRequest {
    /// The wallet info to be created
    pub wallet: ApiWallet,
}

#[wasm_bindgen]
pub fn create_wallet(sk_root: &str) -> Result<JsValue, JsError> {
    let sk_root_key = hex_to_signing_key(sk_root).unwrap();
    let (wallet, _, _) = derive_wallet_from_key(&sk_root_key).unwrap();
    let req = CreateWalletRequest { wallet };

    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
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
    /// The keychain to use for management after the wallet is found
    pub key_chain: ApiKeychain,
}

#[wasm_bindgen]
pub fn find_wallet(sk_root: &str) -> Result<JsValue, JsError> {
    let sk_root_key = hex_to_signing_key(sk_root).unwrap();
    let (wallet, blinder_seed, share_seed) = derive_wallet_from_key(&sk_root_key).unwrap();
    let req = FindWalletRequest {
        wallet_id: wallet.id,
        blinder_seed: blinder_seed.to_biguint(),
        secret_share_seed: share_seed.to_biguint(),
        key_chain: wallet.key_chain,
    };
    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
}

#[wasm_bindgen]
pub fn derive_blinder_share(sk_root: &str) -> Result<JsValue, JsError> {
    let sk_root_key = hex_to_signing_key(sk_root).unwrap();
    let blinder_seed = wrap_eyre!(derive_blinder_seed(&sk_root_key)).unwrap();
    let mut blinder_csprng = PoseidonCSPRNG::new(blinder_seed);
    let (blinder, blinder_private) = blinder_csprng.next_tuple().unwrap();
    let blinder_share = blinder - blinder_private;
    Ok(JsValue::from_str(&blinder_share.to_biguint().to_string()))
}

#[wasm_bindgen]
pub fn wallet_id(sk_root: &str) -> Result<JsValue, JsError> {
    let sk_root_key = hex_to_signing_key(sk_root).unwrap();
    let wallet_id = derive_wallet_id(&sk_root_key).unwrap();
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
    /// A signature of the wallet commitment used in the proof of
    /// VALID WALLET UPDATE by `sk_root`. This allows the contract
    /// to guarantee that the wallet updates are properly authorized
    ///
    /// TODO: For now this is just a blob, we will add this feature in
    /// a follow up
    pub wallet_commitment_sig: Vec<u8>,
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
pub fn deposit(
    wallet_str: &str,
    from_addr: &str,
    mint: &str,
    amount: &str,
    permit_nonce: &str,
    permit_deadline: &str,
    permit_signature: &str,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str);
    // Modify the wallet
    let mint = wrap_eyre!(biguint_from_hex_string(mint)).unwrap();
    let amount = wrap_eyre!(biguint_from_hex_string(amount)).unwrap();
    wrap_eyre!(new_wallet.add_balance(Balance::new_from_mint_and_amount(
        mint.clone(),
        amount.to_u128().unwrap()
    )));
    new_wallet.reblind_wallet();
    // let wallet: ApiWallet = new_wallet.clone().into();
    // let _wallet = serde_json::to_string(&wallet).unwrap();
    // console::log_1(&JsValue::from_str(&_wallet));

    // Sign a commitment to the new shares
    let comm = new_wallet.get_wallet_share_commitment();
    let sig = wrap_eyre!(new_wallet.sign_commitment(comm)).unwrap();

    let req = DepositBalanceRequest {
        from_addr: biguint_from_hex_string(from_addr).unwrap(),
        mint,
        amount,
        wallet_commitment_sig: sig.to_vec(),
        permit_nonce: biguint_from_hex_string(permit_nonce).unwrap(),
        permit_deadline: biguint_from_hex_string(permit_deadline).unwrap(),
        permit_signature: biguint_from_hex_string(permit_signature)
            .unwrap()
            .to_bytes_be(),
    };
    // console::log_1(&JsValue::from_str(&serde_json::to_string(&req).unwrap()));
    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
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
    /// A signature of the wallet commitment used in the proof of
    /// VALID WALLET UPDATE by `sk_root`. This allows the contract
    /// to guarantee that the wallet updates are properly authorized
    ///
    /// TODO: For now this is just a blob, we will add this feature in
    /// a follow up
    pub wallet_commitment_sig: Vec<u8>,
    /// A signature over the external transfer, allowing the contract
    /// to guarantee that the withdrawal is directed at the correct
    /// recipient
    pub external_transfer_sig: Vec<u8>,
}

#[wasm_bindgen]
pub fn withdraw(
    wallet_str: &str,
    mint: &str,
    amount: &str,
    destination_addr: &str,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str);
    // Modify the wallet
    let mint = wrap_eyre!(biguint_from_hex_string(mint)).unwrap();
    let amount = wrap_eyre!(biguint_from_hex_string(amount)).unwrap();
    let destination_addr = wrap_eyre!(biguint_from_hex_string(&destination_addr)).unwrap();
    wrap_eyre!(new_wallet.withdraw(&mint, amount.to_u128().unwrap()));
    new_wallet.reblind_wallet();
    let wallet: ApiWallet = new_wallet.clone().into();
    let _wallet = serde_json::to_string(&wallet).unwrap();

    // Sign a commitment to the new shares
    let comm = new_wallet.get_wallet_share_commitment();
    let sig = wrap_eyre!(new_wallet.sign_commitment(comm)).unwrap();

    let sk_root: SigningKey =
        SigningKey::try_from(&new_wallet.key_chain.secret_keys.sk_root.unwrap()).unwrap();
    // Authorize the withdrawal then send the request
    let withdrawal_sig = authorize_withdrawal(
        &sk_root,
        mint,
        amount.to_u128().unwrap(),
        destination_addr.clone(),
    )?;
    let req = WithdrawBalanceRequest {
        amount,
        destination_addr,
        external_transfer_sig: withdrawal_sig.to_vec(),
        wallet_commitment_sig: sig.to_vec(),
    };
    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
}

/// Generate an authorization for a withdrawal
fn authorize_withdrawal(
    sk_root: &SigningKey,
    mint: BigUint,
    amount: Amount,
    account_addr: BigUint,
) -> Result<Signature, JsError> {
    // Construct a transfer

    let transfer = ExternalTransfer {
        mint,
        amount,
        direction: ExternalTransferDirection::Withdrawal,
        account_addr,
    };

    // Sign the transfer with the root key
    let contract_transfer = to_contract_external_transfer(&transfer).unwrap();
    let buf = serialize_calldata(&contract_transfer)?;
    let digest = keccak256(&buf);
    let (sig, recovery_id) = sk_root.sign_prehash_recoverable(&digest)?;

    Ok(Signature {
        r: U256::from_big_endian(&sig.r().to_bytes()),
        s: U256::from_big_endian(&sig.s().to_bytes()),
        v: recovery_id.to_byte() as u64,
    })
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
    /// A signature of the circuit statement used in the proof of
    /// VALID WALLET UPDATE by `sk_root`. This allows the contract
    /// to guarantee that the wallet updates are properly authorized
    pub statement_sig: Vec<u8>,
}

/// Create an order type from the args
fn create_order(
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
) -> Result<ApiOrder, JsError> {
    // Parse the UUID from the string, or generate a new one if the string is empty
    let id = if id.is_empty() {
        Uuid::new_v4()
    } else {
        Uuid::parse_str(id).map_err(|e| JsError::new(&format!("Invalid UUID: {}", e)))?
    };

    // Convert the side string to OrderSide enum
    let side = match side.to_lowercase().as_str() {
        "sell" => OrderSide::Sell,
        "buy" => OrderSide::Buy,
        _ => return Err(JsError::new("Invalid order side")),
    };

    let amount = wrap_eyre!(biguint_from_hex_string(amount))
        .unwrap()
        .to_u128()
        .unwrap();

    // Create the order
    let worst_case_price = match side {
        OrderSide::Sell => FixedPoint::from_integer(0),
        OrderSide::Buy => FixedPoint::from_integer(u64::MAX),
    };

    Ok(ApiOrder {
        id: id,
        base_mint: biguint_from_hex_string(&base_mint).unwrap(),
        quote_mint: biguint_from_hex_string(&quote_mint).unwrap(),
        side: side,
        amount,
        worst_case_price,
        type_: ApiOrderType::Midpoint,
    })
}

#[wasm_bindgen]
pub fn new_order(
    wallet_str: &str,
    id: &str,
    base_mint: &str,
    quote_mint: &str,
    side: &str,
    amount: &str,
) -> Result<JsValue, JsError> {
    let mut new_wallet = deserialize_wallet(wallet_str);
    let order = create_order(id, base_mint, quote_mint, side, amount)?;
    // Modify the wallet
    wrap_eyre!(new_wallet.add_order(order.id, order.clone().into()));
    new_wallet.reblind_wallet();
    // Sign a commitment to the new shares
    let comm = new_wallet.get_wallet_share_commitment();
    let sig = wrap_eyre!(new_wallet.sign_commitment(comm)).unwrap();

    let req = CreateOrderRequest {
        order,
        statement_sig: sig.to_vec(),
    };
    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
}

/// The request type to cancel a given order
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CancelOrderRequest {
    /// A signature of the circuit statement used in the proof of
    /// VALID WALLET UPDATE by `sk_root`. This allows the contract
    /// to guarantee that the wallet updates are properly authorized
    pub statement_sig: Vec<u8>,
}

#[wasm_bindgen]
pub fn cancel_order(wallet_str: &str, order_id: &str) -> Result<JsValue, JsError> {
    let order_id =
        Uuid::parse_str(order_id).map_err(|e| JsError::new(&format!("Invalid UUID: {}", e)))?;

    let mut new_wallet = deserialize_wallet(wallet_str);

    // Modify the wallet
    new_wallet
        .orders
        .remove(&order_id)
        .expect("order not found");
    new_wallet.reblind_wallet();

    // Sign a commitment to the new shares
    let comm = new_wallet.get_wallet_share_commitment();
    let sig = wrap_eyre!(new_wallet.sign_commitment(comm)).unwrap();

    let req = CancelOrderRequest {
        statement_sig: sig.to_vec(),
    };

    Ok(JsValue::from_str(&serde_json::to_string(&req).unwrap()))
}

#[wasm_bindgen]
/// Build authentication headers for a request
pub fn build_auth_headers(
    sk_root: &str,
    req: &str,
    current_timestamp: u64,
) -> Result<Vec<JsValue>, JsError> {
    // console::log_1(&JsValue::from_str(&sk_root));
    // console::log_1(&JsValue::from_str(&req));
    // console::log_1(&JsValue::from_str(&current_timestamp.to_string()));
    let expiration = current_timestamp + SIG_EXPIRATION_BUFFER_MS;

    let root_key: SigningKey = hex_to_signing_key(sk_root).unwrap();

    // Sign the concatenation of the message and the expiration timestamp
    let req_bytes = req.as_bytes();
    let msg_bytes = req_bytes.to_vec();
    // let payload = [msg_bytes, &expiration.to_le_bytes()].concat();
    let payload = [msg_bytes, expiration.to_le_bytes().to_vec()].concat();

    let signature: K256Signature = root_key.sign(&payload);
    let encoded_sig = b64_general_purpose::STANDARD_NO_PAD.encode(signature.to_bytes());
    // Convert encoded_sig and expiration into JsValue and return them in an array
    // console::log_1(&JsValue::from_str(&encoded_sig));
    // console::log_1(&JsValue::from_str(&expiration.to_string()));
    Ok(vec![
        JsValue::from_str(&encoded_sig),
        JsValue::from_str(&expiration.to_string()),
    ])
}
