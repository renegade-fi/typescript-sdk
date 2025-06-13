//! Wallet helpers for balances in the wallet

use std::iter;

use itertools::Itertools;
use num_bigint::BigUint;
use wasm_bindgen::JsError;

use crate::{
    circuit_types::{balance::Balance, order::Order, Amount},
    MAX_BALANCES,
};

use super::types::Wallet;

/// Error message emitted when a balance overflows
const ERR_BALANCE_OVERFLOW: &str = "balance overflowed";
/// Error message emitted when the balances of a wallet are full
const ERR_BALANCES_FULL: &str = "balances full";
/// Error message emitted when a wallet has insufficient balance for a
/// withdrawal
const ERR_INSUFFICIENT_BALANCE: &str = "insufficient balance";

impl Wallet {
    // -----------
    // | Getters |
    // -----------

    /// Get the balance for a given mint
    pub fn get_balance(&self, mint: &BigUint) -> Option<&Balance> {
        self.balances.get(mint)
    }

    /// Get the index a given balance is at
    pub fn get_balance_index(&self, mint: &BigUint) -> Option<usize> {
        self.balances.index_of(mint)
    }

    /// Get a mutable reference to the balance for a given mint
    pub fn get_balance_mut(&mut self, mint: &BigUint) -> Option<&mut Balance> {
        self.balances.get_mut(mint)
    }

    /// Get a mutable reference to the balance for the given mint or add a
    /// zero'd balance if one does not exist
    pub fn get_balance_mut_or_default(&mut self, mint: &BigUint) -> Result<&mut Balance, JsError> {
        if !self.balances.contains_key(mint) {
            let bal = Balance::new_from_mint(mint.clone());
            self.add_balance(bal)?;
        }

        self.balances.get_mut(mint).ok_or(JsError::new(&format!(
            "Balance not found for mint {}",
            mint
        )))
    }

    /// Get a list of balances in order in their circuit representation
    pub fn get_balances_list(&self) -> Result<[Balance; MAX_BALANCES], JsError> {
        self.balances
            .clone()
            .into_values()
            .chain(iter::repeat(Balance::default()))
            .take(MAX_BALANCES)
            .collect_vec()
            .try_into()
            .map_err(|_| JsError::new("Failed to convert balances to fixed-size array"))
    }

    /// Get the balance that covers the side sold by the given order
    pub fn get_balance_for_order(&self, order: &Order) -> Option<Balance> {
        // Find a balance and fee to associate with this order
        let order_mint = order.send_mint();
        let balance = self.get_balance(order_mint)?.clone();

        Some(balance)
    }

    // -----------
    // | Setters |
    // -----------

    /// Add a balance to the wallet, replacing the first default balance
    pub fn add_balance(&mut self, balance: Balance) -> Result<(), JsError> {
        // If the balance exists, increment it
        if let Some(bal) = self.balances.get_mut(&balance.mint) {
            bal.amount = bal
                .amount
                .checked_add(balance.amount)
                .ok_or(JsError::new(ERR_BALANCE_OVERFLOW))?;
            return Ok(());
        }

        if let Some(index) = self.find_first_replaceable_balance() {
            self.balances
                .replace_at_index(index, balance.mint.clone(), balance);
        } else if self.balances.len() < MAX_BALANCES {
            self.balances.append(balance.mint.clone(), balance);
        } else {
            return Err(JsError::new(ERR_BALANCES_FULL));
        }

        Ok(())
    }

    /// Find the first replaceable balance
    fn find_first_replaceable_balance(&self) -> Option<usize> {
        self.balances
            .iter()
            .position(|(_, balance)| balance.is_zero())
    }

    /// Withdraw an amount from the balance for the given mint
    pub fn withdraw(&mut self, mint: &BigUint, amount: Amount) -> Result<(), JsError> {
        let bal = self
            .get_balance_mut(mint)
            .ok_or(JsError::new(ERR_INSUFFICIENT_BALANCE))?;

        if bal.amount < amount {
            return Err(JsError::new(ERR_INSUFFICIENT_BALANCE));
        }

        bal.amount = bal.amount.saturating_sub(amount);
        Ok(())
    }

    /// Remove a balance from the wallet, replacing it with a default balance
    pub fn remove_balance(&mut self, mint: &BigUint) -> Option<Balance> {
        // Replace the balance with a default balance to preserve the balance order for
        // wallet update proofs
        let bal = self.get_balance_mut(mint)?;
        *bal = Balance::default();

        Some(bal.clone())
    }
}
