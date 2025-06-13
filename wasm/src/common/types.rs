use std::str::FromStr;

use super::{keychain::KeyChain, keyed_list::KeyedList};
use crate::{
    circuit_types::{
        balance::Balance, compute_wallet_share_commitment, create_wallet_shares_from_private,
        create_wallet_shares_with_randomness, elgamal::EncryptionKey, fixed_point::FixedPoint,
        order::Order, wallet::WalletShareStateCommitment, SizedWallet as SizedCircuitWallet,
    },
    helpers::{evaluate_hash_chain, PoseidonCSPRNG},
    types::Scalar,
    CLUSTER_SYMMETRIC_KEY_LENGTH, MAX_BALANCES, MAX_ORDERS, NUM_SCALARS,
};
use derivative::Derivative;
use itertools::Itertools;
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use wasm_bindgen::JsError;

/// A type alias for the wallet identifier type, currently a UUID
pub type WalletIdentifier = Uuid;
/// An identifier of an order used for caching
pub type OrderIdentifier = Uuid;
/// The type representing a cluster's symmetric key
pub type SymmetricAuthKey = [u8; CLUSTER_SYMMETRIC_KEY_LENGTH];

/// Represents a wallet managed by the local relayer
#[derive(Clone, Debug, Serialize, Derivative, Deserialize)]
#[derivative(PartialEq)]
pub struct Wallet {
    /// The identifier used to index the wallet
    pub wallet_id: WalletIdentifier,
    /// A list of orders in this wallet
    ///
    /// We use an `IndexMap` here to preserve the order of insertion
    /// on the orders. This is necessary because we must have
    /// order parity with the secret shared wallet stored on-chain
    pub orders: KeyedList<OrderIdentifier, Order>,
    /// A mapping of mint to Balance information
    pub balances: KeyedList<BigUint, Balance>,
    /// The keys that the relayer has access to for this wallet
    pub key_chain: KeyChain,
    /// The wallet blinder, used to blind secret shares the wallet holds
    pub blinder: Scalar,
    /// The match fee that the owner has authorized the relayer to take
    pub match_fee: FixedPoint,
    /// The key of the cluster that the wallet has delegated management to
    pub managing_cluster: EncryptionKey,
    // TODO: BigUint vs. Scalar, what do helper functions expect?
    /// The private secret shares of the wallet
    pub private_shares: Vec<Scalar>,
    /// The public secret shares of the wallet
    pub blinded_public_shares: Vec<Scalar>,
}

impl TryFrom<Wallet> for SizedCircuitWallet {
    type Error = JsError;

    fn try_from(wallet: Wallet) -> Result<Self, Self::Error> {
        Ok(SizedCircuitWallet {
            balances: wallet.get_balances_list()?,
            orders: wallet.get_orders_list()?,
            keys: wallet.key_chain.public_keys,
            match_fee: wallet.match_fee,
            managing_cluster: wallet.managing_cluster,
            blinder: wallet.blinder,
        })
    }
}

impl Wallet {
    /// Create a new empty wallet from the given seed information
    pub fn new_empty_wallet(
        wallet_id: WalletIdentifier,
        blinder_seed: Scalar,
        share_seed: Scalar,
        key_chain: KeyChain,
    ) -> Result<Self, JsError> {
        // Create a wallet with dummy shares, compute the shares, then update the wallet
        let dummy_shares = vec![Scalar::zero(); 70];

        let mut wallet = Self {
            wallet_id,
            orders: KeyedList::new(),
            balances: KeyedList::new(),
            match_fee: FixedPoint::from_integer(0),
            managing_cluster: EncryptionKey::default(),
            key_chain,
            blinded_public_shares: dummy_shares.clone(),
            private_shares: dummy_shares,
            blinder: Scalar::zero(),
        };

        // Cast the wallet to a circuit type to use the circuit helpers
        let circuit_wallet: SizedCircuitWallet = wallet.clone().try_into()?;

        // Sample blinders and private shares
        let mut blinder_csprng = PoseidonCSPRNG::new(blinder_seed);
        let (blinder, blinder_private) = blinder_csprng
            .next_tuple()
            .ok_or(JsError::new("Failed to generate blinder tuple"))?;

        let share_csprng = PoseidonCSPRNG::new(share_seed);
        let private_shares = share_csprng.take(NUM_SCALARS).collect_vec();

        let (private_shares, blinded_public_shares) = create_wallet_shares_with_randomness(
            &circuit_wallet,
            blinder,
            blinder_private,
            private_shares,
        );
        wallet.private_shares = private_shares;
        wallet.blinded_public_shares = blinded_public_shares;
        wallet.blinder = blinder;

        Ok(wallet)
    }

    /// Compute the commitment to the full wallet shares
    pub fn get_wallet_share_commitment(&self) -> WalletShareStateCommitment {
        compute_wallet_share_commitment::<MAX_BALANCES, MAX_ORDERS>(
            &self.blinded_public_shares,
            &self.private_shares,
        )
    }

    // -----------
    // | Setters |
    // -----------

    /// Reblind the wallet, consuming the next set of blinders and secret shares
    pub fn reblind_wallet(&mut self) -> Result<(), JsError> {
        let private_shares_serialized: Vec<Scalar> = self.private_shares.clone();

        // Sample a new blinder and private secret share
        let n_shares = private_shares_serialized.len();
        let blinder_and_private_share =
            evaluate_hash_chain(private_shares_serialized[n_shares - 1], 2 /* length */);
        let new_blinder = blinder_and_private_share[0];
        let new_blinder_private_share = blinder_and_private_share[1];

        // Sample new secret shares for the wallet
        let mut new_private_shares =
            evaluate_hash_chain(private_shares_serialized[n_shares - 2], n_shares - 1);
        new_private_shares.push(new_blinder_private_share);

        let circuit_wallet: SizedCircuitWallet = self.clone().try_into()?;
        let (new_private_share, new_public_share) =
            create_wallet_shares_from_private(&circuit_wallet, &new_private_shares, new_blinder);

        self.private_shares = new_private_share;
        self.blinded_public_shares = new_public_share;
        self.blinder = new_blinder;
        Ok(())
    }
}

/// The chain environment
#[derive(Copy, Clone, Debug)]
pub enum Chain {
    /// The Arbitrum Sepolia chain
    ArbitrumSepolia,
    /// The Arbitrum One chain
    ArbitrumOne,
    /// The Base Sepolia chain
    BaseSepolia,
    /// The Base Mainnet chain
    BaseMainnet,
    /// Any local devnet chain
    Devnet,
}

impl FromStr for Chain {
    type Err = JsError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "arbitrum-sepolia" => Ok(Chain::ArbitrumSepolia),
            "arbitrum-one" => Ok(Chain::ArbitrumOne),
            "base-sepolia" => Ok(Chain::BaseSepolia),
            "base-mainnet" => Ok(Chain::BaseMainnet),
            "devnet" => Ok(Chain::Devnet),
            _ => Err(JsError::new(&format!("Invalid chain: {s}"))),
        }
    }
}
