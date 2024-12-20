use num_bigint::BigUint;
use num_traits::ToPrimitive;

use crate::{exports::error::WasmError, helpers::biguint_from_hex_string};

pub struct WithdrawParameters {
    pub mint: BigUint,
    pub amount: BigUint,
    pub destination_addr: BigUint,
}

impl WithdrawParameters {
    pub fn new(mint: &str, amount: &str, destination_addr: &str) -> Result<Self, WasmError> {
        let mint = biguint_from_hex_string(mint)
            .map_err(|e| WasmError::InvalidParameter(format!("Invalid mint: {}", e)))?;

        let amount = biguint_from_hex_string(amount)
            .map_err(|e| WasmError::InvalidParameter(format!("Invalid amount: {}", e)))?;

        let destination_addr = biguint_from_hex_string(destination_addr).map_err(|e| {
            WasmError::InvalidParameter(format!("Invalid destination address: {}", e))
        })?;

        Ok(Self {
            mint,
            amount,
            destination_addr,
        })
    }

    pub fn amount_as_u128(&self) -> Result<u128, WasmError> {
        self.amount.to_u128().ok_or_else(|| {
            WasmError::InvalidParameter(format!("Could not convert {} to u128", self.amount))
        })
    }
}
