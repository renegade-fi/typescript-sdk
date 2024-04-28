
use serde::{Deserialize, Serialize};

use crate::types::Scalar;

use super::{
    balance::Balance, deserialize_array, elgamal::EncryptionKey, fixed_point::FixedPoint,
    keychain::PublicKeyChain, order::Order, scalar_from_hex_string, scalar_to_hex_string,
    serialize_array,
};

/// A commitment to the wallet's secret shares that is entered into the global
/// state
pub type WalletShareStateCommitment = Scalar;

// --------------------
// | Wallet Base Type |
// --------------------

/// Represents the base type of a wallet holding orders, balances, fees, keys
/// and cryptographic randomness
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Wallet<const MAX_BALANCES: usize, const MAX_ORDERS: usize> {
    /// The list of balances in the wallet
    #[serde(
        serialize_with = "serialize_array",
        deserialize_with = "deserialize_array"
    )]
    pub balances: [Balance; MAX_BALANCES],
    /// The list of open orders in the wallet
    #[serde(
        serialize_with = "serialize_array",
        deserialize_with = "deserialize_array"
    )]
    pub orders: [Order; MAX_ORDERS],
    /// The key tuple used by the wallet; i.e. (pk_root, pk_match, pk_settle,
    /// pk_view)
    pub keys: PublicKeyChain,
    /// The match fee authorized by the wallet owner that the relayer may take
    /// on a match
    pub match_fee: FixedPoint,
    /// The public key of the cluster that this wallet has been delegated to for
    /// matches
    ///
    /// Authorizes fees to be settled out of the wallet by the holder of the
    /// corresponding private key
    pub managing_cluster: EncryptionKey,
    /// key The wallet randomness used to blind secret shares
    #[serde(
        serialize_with = "scalar_to_hex_string",
        deserialize_with = "scalar_from_hex_string"
    )]
    pub blinder: Scalar,
}

impl<const MAX_BALANCES: usize, const MAX_ORDERS: usize> Wallet<MAX_BALANCES, MAX_ORDERS> {
    /// Converts the wallet into a flat list of scalars.
    pub fn to_scalars(&self) -> Vec<Scalar> {
        let mut scalars = Vec::new();

        // Convert balances to scalars and append
        for balance in self.balances.iter() {
            scalars.extend(balance.to_scalars());
        }

        // Convert orders to scalars and append
        for order in self.orders.iter() {
            scalars.extend(order.to_scalars());
        }

        // Convert keys to scalars and append
        scalars.extend(self.keys.to_scalars());

        // Convert match_fee to scalar and append
        scalars.push(self.match_fee.repr);

        // Convert managing_cluster to scalar and append
        scalars.extend(self.managing_cluster.to_scalars());

        // Append blinder directly as it is already a scalar
        scalars.push(self.blinder);

        scalars
    }
}
