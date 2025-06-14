//! Wallet helpers for orders in the wallet

use itertools::Itertools;
use wasm_bindgen::JsError;

use crate::{circuit_types::order::Order, MAX_ORDERS};

use super::types::{OrderIdentifier, Wallet};

/// Error message emitted when the orders of a wallet are full
const ERR_ORDERS_FULL: &str = "orders full";

impl Wallet {
    // -----------
    // | Getters |
    // -----------

    /// Get the given order
    pub fn get_order(&self, order_id: &OrderIdentifier) -> Option<&Order> {
        self.orders.get(order_id)
    }

    /// Get a mutable reference to the given order
    pub fn get_order_mut(&mut self, order_id: &OrderIdentifier) -> Option<&mut Order> {
        self.orders.get_mut(order_id)
    }

    /// Get a list of orders in order in their circuit representation
    pub fn get_orders_list(&self) -> Result<[Order; MAX_ORDERS], JsError> {
        self.orders
            .clone()
            .into_values()
            .chain(std::iter::repeat(Order::default()))
            .take(MAX_ORDERS)
            .collect::<Vec<_>>()
            .try_into()
            .map_err(|_| JsError::new("Failed to convert orders to fixed-size array"))
    }

    /// Get the list of orders that are eligible for matching
    ///
    /// An order is ready to match if it is non-zero and has a non-zero sell
    /// balance backing it
    pub fn get_matchable_orders(&self) -> Vec<(OrderIdentifier, Order)> {
        self.orders
            .iter()
            .filter(|(_id, order)| {
                let send_mint = order.send_mint();
                let has_balance = match self.get_balance(send_mint) {
                    Some(balance) => balance.amount > 0,
                    None => false,
                };

                !order.is_zero() && has_balance
            })
            .cloned()
            .collect_vec()
    }

    // -----------
    // | Setters |
    // -----------

    /// Add an order to the wallet, replacing the first default order if the
    /// wallet is full
    pub fn add_order(&mut self, id: OrderIdentifier, order: Order) -> Result<(), JsError> {
        // Append if the orders are not full
        if let Some(index) = self.find_first_replaceable_order() {
            self.orders.replace_at_index(index, id, order);
        } else if self.orders.len() < MAX_ORDERS {
            self.orders.append(id, order)
        } else {
            return Err(JsError::new(ERR_ORDERS_FULL));
        }

        Ok(())
    }

    /// Find the first default order in the wallet
    fn find_first_replaceable_order(&self) -> Option<usize> {
        self.orders.iter().position(|(_, order)| order.is_zero())
    }

    /// Remove an order from the wallet, replacing it with a default order
    pub fn remove_order(&mut self, id: &OrderIdentifier) -> Option<Order> {
        self.orders.remove(id)
    }
}
