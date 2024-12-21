//! Groups API type definitions for wallet API operations
//! Groups API type definitions for wallet API operations

use num_bigint::BigUint;
use serde::{Deserialize, Serialize};

use crate::common::types::WalletIdentifier;
use crate::external_api::types::{ApiOrder, ApiPrivateKeychain, ApiWallet};
use crate::helpers::{deserialize_biguint_from_hex_string, serialize_biguint_to_hex_string};

/// The type encapsulating a wallet update's authorization parameters
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
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
// --------------------
// | Wallet API Types |
// --------------------

/// The request type to create a new wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateWalletRequest {
    /// The wallet info to be created
    pub wallet: ApiWallet,
    /// The blinder seed to use for the wallet
    pub blinder_seed: BigUint,
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

// ---------------------------
// | Wallet Orders API Types |
// ---------------------------

/// The request type to add a new order to a given wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    /// The order to be created
    pub order: ApiOrder,
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
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

/// The request type to cancel a given order
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CancelOrderRequest {
    /// The authorization parameters for the update
    #[serde(flatten)]
    pub update_auth: WalletUpdateAuthorization,
}

// -----------------------------
// | Wallet Balances API Types |
// -----------------------------

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
