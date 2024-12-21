use crate::{exports::error::Error, helpers::biguint_from_hex_string};
use num_bigint::BigUint;
use num_traits::ToPrimitive;

pub struct DepositParameters {
    pub public_key: String,
    pub from_addr: BigUint,
    pub mint: BigUint,
    pub amount: BigUint,
    pub permit_nonce: BigUint,
    pub permit_deadline: BigUint,
    pub permit_signature: Vec<u8>,
}

impl DepositParameters {
    pub fn new(
        public_key: &str,
        from_addr: &str,
        mint: &str,
        amount: &str,
        permit_nonce: &str,
        permit_deadline: &str,
        permit_signature: &str,
    ) -> Result<Self, Error> {
        Ok(Self {
            public_key: public_key.to_string(),
            from_addr: biguint_from_hex_string(from_addr)
                .map_err(|e| Error::invalid_parameter(format!("from_addr: {}", e)))?,
            mint: biguint_from_hex_string(mint)
                .map_err(|e| Error::invalid_parameter(format!("mint: {}", e)))?,
            amount: biguint_from_hex_string(amount)
                .map_err(|e| Error::invalid_parameter(format!("amount: {}", e)))?,
            permit_nonce: biguint_from_hex_string(permit_nonce)
                .map_err(|e| Error::invalid_parameter(format!("permit_nonce: {}", e)))?,
            permit_deadline: biguint_from_hex_string(permit_deadline)
                .map_err(|e| Error::invalid_parameter(format!("permit_deadline: {}", e)))?,
            permit_signature: biguint_from_hex_string(permit_signature)
                .map_err(|e| Error::invalid_parameter(format!("permit_signature: {}", e)))?
                .to_bytes_be(),
        })
    }

    pub fn amount_as_u128(&self) -> Result<u128, Error> {
        self.amount.to_u128().ok_or_else(|| {
            Error::invalid_parameter(format!("Could not convert {} to u128", self.amount))
        })
    }
}
