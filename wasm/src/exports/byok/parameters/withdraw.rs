use num_bigint::BigUint;
use num_traits::ToPrimitive;

use crate::{exports::error::Error, helpers::biguint_from_hex_string};

pub struct WithdrawParameters {
    pub mint: BigUint,
    pub amount: BigUint,
    pub destination_addr: BigUint,
}

impl WithdrawParameters {
    pub fn new(mint: &str, amount: &str, destination_addr: &str) -> Result<Self, Error> {
        let mint = biguint_from_hex_string(mint)
            .map_err(|e| Error::invalid_parameter(format!("Invalid mint: {}", e)))?;

        let amount = biguint_from_hex_string(amount)
            .map_err(|e| Error::invalid_parameter(format!("Invalid amount: {}", e)))?;

        let destination_addr = biguint_from_hex_string(destination_addr)
            .map_err(|e| Error::invalid_parameter(format!("Invalid destination address: {}", e)))?;

        Ok(Self {
            mint,
            amount,
            destination_addr,
        })
    }

    pub fn amount_as_u128(&self) -> Result<u128, Error> {
        self.amount.to_u128().ok_or_else(|| {
            Error::invalid_parameter(format!("Could not convert {} to u128", self.amount))
        })
    }
}
