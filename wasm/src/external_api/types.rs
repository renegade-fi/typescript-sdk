use itertools::Itertools;
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    circuit_types::{
        balance::Balance,
        fixed_point::FixedPoint,
        keychain::{PublicIdentificationKey, PublicKeyChain, SecretIdentificationKey},
        order::{Order, OrderSide},
        Amount,
    },
    common::{
        keychain::{HmacKey, KeyChain, PrivateKeyChain},
        types::{OrderIdentifier, Wallet},
    },
    helpers::{
        deserialize_biguint_from_hex_string, jubjub_from_hex_string, jubjub_to_hex_string,
        nonnative_scalar_from_hex_string, nonnative_scalar_to_hex_string,
        public_sign_key_from_hex_string, public_sign_key_to_hex_string, scalar_from_hex_string,
        scalar_to_hex_string, serialize_biguint_to_hex_string,
    },
    types::{biguint_to_scalar, scalar_to_biguint, scalar_to_u64, Scalar},
};

use super::http::ExternalOrder;

// --------------------
// | Wallet API Types |
// --------------------

/// The wallet type, holds all balances, orders, metadata, and randomness
/// for a trader
///
/// Also the unit of commitment in the state tree
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiWallet {
    /// Identifier
    pub id: Uuid,
    /// The orders maintained by this wallet
    pub orders: Vec<ApiOrder>,
    /// The balances maintained by the wallet to cover orders
    pub balances: Vec<Balance>,
    /// The keys that authenticate wallet access
    pub key_chain: ApiKeychain,
    /// The managing cluster's public key
    ///
    /// The public encryption key of the cluster that may collect relayer fees
    /// on this wallet
    pub managing_cluster: String,
    /// The take rate at which the managing cluster may collect relayer fees on
    /// a match
    pub match_fee: FixedPoint,
    /// The public secret shares of the wallet
    pub blinded_public_shares: Vec<BigUint>,
    /// The private secret shares of the wallet
    pub private_shares: Vec<BigUint>,
    /// The wallet blinder, used to blind wallet secret shares
    pub blinder: BigUint,
}

/// Conversion from a wallet that has been indexed in the global state to the
/// API type
impl From<Wallet> for ApiWallet {
    fn from(wallet: Wallet) -> Self {
        // Build API types from the indexed wallet
        let orders = wallet
            .orders
            .into_iter()
            .map(|order| order.into())
            .collect_vec();
        let balances = wallet.balances.into_values().collect_vec();

        // Serialize the shares then convert all values to BigUint
        let blinded_public_shares = wallet
            .blinded_public_shares
            .iter()
            .map(scalar_to_biguint)
            .collect_vec();
        let private_shares = wallet
            .private_shares
            .iter()
            .map(scalar_to_biguint)
            .collect_vec();

        Self {
            id: wallet.wallet_id,
            orders,
            balances,
            key_chain: wallet.key_chain.into(),
            managing_cluster: jubjub_to_hex_string(&wallet.managing_cluster),
            match_fee: wallet.match_fee,
            blinded_public_shares,
            private_shares,
            blinder: scalar_to_biguint(&wallet.blinder),
        }
    }
}

impl TryFrom<ApiWallet> for Wallet {
    type Error = String;

    fn try_from(wallet: ApiWallet) -> Result<Self, Self::Error> {
        let orders = wallet
            .orders
            .into_iter()
            .map(|order| (order.id, order.into()))
            .collect();
        let balances = wallet
            .balances
            .into_iter()
            .map(|balance| (balance.mint.clone(), balance))
            .collect();

        // Deserialize the shares to scalar then re-structure into WalletSecretShare
        let blinded_public_shares: Vec<Scalar> = wallet
            .blinded_public_shares
            .iter()
            .map(biguint_to_scalar)
            .collect();
        let private_shares: Vec<Scalar> = wallet
            .private_shares
            .iter()
            .map(biguint_to_scalar)
            .collect();

        let managing_cluster = jubjub_from_hex_string(&wallet.managing_cluster)?;

        Ok(Wallet {
            wallet_id: wallet.id,
            orders,
            balances,
            key_chain: wallet.key_chain.try_into()?,
            match_fee: wallet.match_fee,
            managing_cluster,
            blinder: biguint_to_scalar(&wallet.blinder),
            blinded_public_shares,
            private_shares,
        })
    }
}

/// The order type, represents a trader's intention in the pool
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ApiOrder {
    /// Identifier
    pub id: Uuid,
    /// The quote token mint
    #[serde(
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub quote_mint: BigUint,
    /// The base token mint
    #[serde(
        serialize_with = "serialize_biguint_to_hex_string",
        deserialize_with = "deserialize_biguint_from_hex_string"
    )]
    pub base_mint: BigUint,
    /// The side of the market this order is on
    pub side: OrderSide,
    /// The type of order
    #[serde(rename = "type")]
    pub type_: ApiOrderType,
    /// The worse case price that the order may be executed at
    ///
    /// For buy side orders this is a maximum price, for sell side orders
    /// this is a minimum price
    pub worst_case_price: FixedPoint,
    /// The order size
    pub amount: Amount,
    /// The minimum fill amount
    #[serde(default)]
    pub min_fill_size: Amount,
    /// Whether or not to allow external matches
    #[serde(default)]
    pub allow_external_matches: bool,
}

impl From<(OrderIdentifier, Order)> for ApiOrder {
    fn from((order_id, order): (OrderIdentifier, Order)) -> Self {
        ApiOrder {
            id: order_id,
            quote_mint: order.quote_mint,
            base_mint: order.base_mint,
            side: order.side,
            type_: ApiOrderType::Midpoint,
            worst_case_price: order.worst_case_price,
            amount: order.amount,
            min_fill_size: order.min_fill_size,
            allow_external_matches: order.allow_external_matches,
        }
    }
}

impl From<ApiOrder> for Order {
    fn from(order: ApiOrder) -> Self {
        Order {
            quote_mint: order.quote_mint,
            base_mint: order.base_mint,
            side: order.side,
            worst_case_price: order.worst_case_price,
            amount: order.amount,
            min_fill_size: order.min_fill_size,
            allow_external_matches: order.allow_external_matches,
        }
    }
}

/// The type of order, currently limit or midpoint
#[derive(Clone, Default, Debug, Serialize, Deserialize)]
pub enum ApiOrderType {
    /// A market-midpoint pegged order
    #[default]
    Midpoint = 0,
    /// A limit order with specified price attached
    Limit,
}

/// A keychain API type that maintains all keys as hex strings, conversion to
/// the runtime keychain type involves deserializing these keys into their
/// native types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeychain {
    /// The public keychain
    pub public_keys: ApiPublicKeychain,
    /// The private keychain
    pub private_keys: ApiPrivateKeychain,
    /// The nonce of the keychain
    #[serde(default)]
    pub nonce: u64,
}

/// A public keychain for the API wallet
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiPublicKeychain {
    /// The public root key of the wallet
    pub pk_root: String,
    /// The public match key of the wallet
    pub pk_match: String,
}

/// A private keychain for the API wallet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiPrivateKeychain {
    /// The private root key of the wallet
    pub sk_root: Option<String>,
    /// The private match key of the wallet
    pub sk_match: String,
    /// The symmetric key of the wallet
    pub symmetric_key: String,
}

impl ApiPrivateKeychain {
    /// Deletes the sk_root by setting it to None
    pub fn delete_sk_root(&mut self) {
        self.sk_root = None;
    }
}

impl TryFrom<ApiPrivateKeychain> for PrivateKeyChain {
    type Error = String;

    fn try_from(keys: ApiPrivateKeychain) -> Result<Self, Self::Error> {
        let sk_root = keys
            .sk_root
            .clone()
            .map(|k| nonnative_scalar_from_hex_string(&k))
            .transpose()?;

        Ok(PrivateKeyChain {
            sk_root,
            sk_match: SecretIdentificationKey {
                key: scalar_from_hex_string(&keys.sk_match)?,
            },
            symmetric_key: HmacKey::from_hex_string(&keys.symmetric_key)?,
        })
    }
}

impl From<KeyChain> for ApiKeychain {
    fn from(keys: KeyChain) -> Self {
        Self {
            public_keys: ApiPublicKeychain {
                pk_root: public_sign_key_to_hex_string(&keys.pk_root()),
                pk_match: scalar_to_hex_string(&keys.pk_match().key),
            },
            private_keys: ApiPrivateKeychain {
                sk_root: keys.sk_root().map(|k| nonnative_scalar_to_hex_string(&k)),
                sk_match: scalar_to_hex_string(&keys.sk_match().key),
                symmetric_key: keys.symmetric_key().to_hex_string(),
            },
            nonce: scalar_to_u64(&keys.public_keys.nonce),
        }
    }
}

impl TryFrom<ApiKeychain> for KeyChain {
    type Error = String;

    fn try_from(keys: ApiKeychain) -> Result<Self, Self::Error> {
        Ok(KeyChain {
            public_keys: PublicKeyChain {
                pk_root: public_sign_key_from_hex_string(&keys.public_keys.pk_root)?,
                pk_match: PublicIdentificationKey {
                    key: scalar_from_hex_string(&keys.public_keys.pk_match)?,
                },
                nonce: keys.nonce.into(),
            },
            secret_keys: PrivateKeyChain::try_from(keys.private_keys)?,
        })
    }
}

// ----------------------------
// | External Match API Types |
// ----------------------------

/// The fee takes from a match
#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct FeeTake {
    /// The fee the relayer takes
    pub relayer_fee: Amount,
    /// The fee the protocol takes
    pub protocol_fee: Amount,
}

/// An external quote response, potentially with gas sponsorship info.
///
/// We manually flatten the fields of [`SignedExternalQuote`] since `serde`
/// doesn't support `u128`s when using `#[serde(flatten)]`
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SponsoredQuoteResponse {
    /// The quote
    pub quote: ApiExternalQuote,
    /// The signature
    pub signature: String,
    /// The signed gas sponsorship info, if sponsorship was requested
    pub gas_sponsorship_info: Option<SignedGasSponsorshipInfo>,
}
/// A signed quote for an external order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedExternalQuote {
    /// The quote
    pub quote: ApiExternalQuote,
    /// The signature
    pub signature: String,
}

/// Signed metadata regarding gas sponsorship for a quote
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignedGasSponsorshipInfo {
    /// The signed gas sponsorship info
    pub gas_sponsorship_info: GasSponsorshipInfo,
    /// The auth server's signature over the sponsorship info
    #[deprecated(since = "0.0.2", note = "Gas sponsorship info is no longer signed")]
    pub signature: String,
}

/// Metadata regarding gas sponsorship for a quote
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GasSponsorshipInfo {
    /// The amount to be refunded as a result of gas sponsorship.
    /// This amount is firm, it will not change when the quote is assembled.
    pub refund_amount: u128,
    /// Whether the refund is in terms of native ETH.
    pub refund_native_eth: bool,
    /// The address to which the refund will be sent, if set explicitly.
    pub refund_address: Option<String>,
}

/// A quote for an external order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiExternalQuote {
    /// The external order
    pub order: ExternalOrder,
    /// The match result
    pub match_result: ApiExternalMatchResult,
    /// The estimated fees for the match
    pub fees: FeeTake,
    /// The amount sent by the external party
    pub send: ApiExternalAssetTransfer,
    /// The amount received by the external party, net of fees
    pub receive: ApiExternalAssetTransfer,
    /// The price of the match
    pub price: ApiTimestampedPrice,
    /// The timestamp of the quote
    pub timestamp: u64,
}

/// An API server external match result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiExternalMatchResult {
    /// The mint of the quote token in the matched asset pair
    pub quote_mint: String,
    /// The mint of the base token in the matched asset pair
    pub base_mint: String,
    /// The amount of the quote token exchanged by the match
    pub quote_amount: Amount,
    /// The amount of the base token exchanged by the match
    pub base_amount: Amount,
    /// The direction of the match
    pub direction: OrderSide,
}

/// An asset transfer from an external party
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiExternalAssetTransfer {
    /// The mint of the asset
    pub mint: String,
    /// The amount of the asset
    pub amount: Amount,
}

/// The price of a quote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiTimestampedPrice {
    /// The price, serialized as a string to prevent floating point precision
    /// issues
    pub price: String,
    /// The timestamp, in milliseconds since the epoch
    pub timestamp: u64,
}
