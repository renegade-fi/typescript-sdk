use num_bigint::BigUint;

use serde::{Deserialize, Serialize};

use crate::types::{biguint_to_scalar, Scalar};

use super::{biguint_from_hex_string, biguint_to_hex_string, Amount};

/// Represents the base type of a balance in tuple holding a reference to the
/// ERC-20 token and its amount
#[derive(Clone, Default, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Balance {
    /// The mint (ERC-20 token address) of the token in the balance
    #[serde(
        serialize_with = "biguint_to_hex_string",
        deserialize_with = "biguint_from_hex_string"
    )]
    pub mint: BigUint,
    /// The amount of the given token stored in this balance
    pub amount: Amount,
    /// The amount of this balance owed to the managing relayer cluster
    pub relayer_fee_balance: Amount,
    /// The amount of this balance owed to the protocol
    pub protocol_fee_balance: Amount,
}

impl Balance {
    /// Whether or not the instance is a default balance
    pub fn is_default(&self) -> bool {
        self.eq(&Balance::default())
    }

    /// Whether or not the balance is zero'd
    pub fn is_zero(&self) -> bool {
        self.amount == 0 && self.relayer_fee_balance == 0 && self.protocol_fee_balance == 0
    }

    /// Construct a zero'd balance from a mint
    pub fn new_from_mint(mint: BigUint) -> Balance {
        Balance {
            mint,
            amount: 0,
            relayer_fee_balance: 0,
            protocol_fee_balance: 0,
        }
    }

    /// Construct a balance with zero fees from a mint and amount
    pub fn new_from_mint_and_amount(mint: BigUint, amount: Amount) -> Balance {
        Balance {
            mint,
            amount,
            relayer_fee_balance: 0,
            protocol_fee_balance: 0,
        }
    }

    /// Converts the balance into a list of scalars.
    pub fn to_scalars(&self) -> Vec<Scalar> {
        let mut scalars = Vec::new();
        scalars.push(biguint_to_scalar(&self.mint));
        scalars.push(Scalar::from(self.amount));
        scalars.push(Scalar::from(self.relayer_fee_balance));
        scalars.push(Scalar::from(self.protocol_fee_balance));

        scalars
    }
}
