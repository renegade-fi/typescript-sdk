use num_bigint::BigUint;

use serde::{Deserialize, Serialize};

use crate::types::{biguint_to_scalar, Scalar};

use super::{biguint_from_hex_string, biguint_to_hex_string, fixed_point::FixedPoint, Amount};

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Order {
    /// The mint (ERC-20 contract address) of the quote token
    #[serde(
        serialize_with = "biguint_to_hex_string",
        deserialize_with = "biguint_from_hex_string"
    )]
    pub quote_mint: BigUint,
    /// The mint (ERC-20 contract address) of the base token
    #[serde(
        serialize_with = "biguint_to_hex_string",
        deserialize_with = "biguint_from_hex_string"
    )]
    pub base_mint: BigUint,
    /// The side this order is for (0 = buy, 1 = sell)
    pub side: OrderSide,
    /// The amount of base currency to buy or sell
    pub amount: Amount,
    /// The worse case price the user is willing to accept on this order
    ///
    /// If the order is a buy, this is the maximum price the user is willing to
    /// pay If the order is a sell, this is the minimum price the user is
    /// willing to accept
    pub worst_case_price: FixedPoint,
    /// The minimum fill amount
    pub min_fill_size: Amount,
}

impl Order {
    /// Whether or not this is the zero'd order
    pub fn is_default(&self) -> bool {
        self.eq(&Self::default())
    }

    /// Whether or not this order is for zero volume
    ///
    /// This is a superset of the class of orders that `is_default` returns
    /// true for
    pub fn is_zero(&self) -> bool {
        self.amount == 0
    }

    /// The mint of the token sent by the creator of this order in the event
    /// that the order is matched
    pub fn send_mint(&self) -> &BigUint {
        match self.side {
            OrderSide::Buy => &self.quote_mint,
            OrderSide::Sell => &self.base_mint,
        }
    }

    /// The mint of the token received by the creator of this order in the event
    /// that the order is matched
    pub fn receive_mint(&self) -> &BigUint {
        match self.side {
            OrderSide::Buy => &self.base_mint,
            OrderSide::Sell => &self.quote_mint,
        }
    }

    /// Converts the order into a list of scalars.
    pub fn to_scalars(&self) -> Vec<Scalar> {
        vec![
            biguint_to_scalar(&self.quote_mint),
            biguint_to_scalar(&self.base_mint),
            Scalar::from(self.side.to_biguint()),
            Scalar::from(self.amount),
            self.worst_case_price.repr,
        ]
    }
}

/// The side of the market a given order is on
#[derive(Clone, Copy, Default, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy side
    #[default]
    Buy = 0,
    /// Sell side
    Sell,
}

impl OrderSide {
    /// Converts the order side to a scalar.
    pub fn to_biguint(&self) -> BigUint {
        // Convert the enum to its integer representation
        let value = match self {
            OrderSide::Buy => 0u32,
            OrderSide::Sell => 1,
        };

        // Convert the integer to BigUint
        BigUint::from(value)
    }
}
