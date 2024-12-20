use crate::{exports::error::WasmError, helpers::biguint_from_hex_string};
use num_bigint::BigUint;

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
    ) -> Result<Self, WasmError> {
        Ok(Self {
            public_key: public_key.to_string(),
            from_addr: biguint_from_hex_string(from_addr)
                .map_err(|e| WasmError::InvalidParameter(format!("from_addr: {}", e)))?,
            mint: biguint_from_hex_string(mint)
                .map_err(|e| WasmError::InvalidParameter(format!("mint: {}", e)))?,
            amount: biguint_from_hex_string(amount)
                .map_err(|e| WasmError::InvalidParameter(format!("amount: {}", e)))?,
            permit_nonce: biguint_from_hex_string(permit_nonce)
                .map_err(|e| WasmError::InvalidParameter(format!("permit_nonce: {}", e)))?,
            permit_deadline: biguint_from_hex_string(permit_deadline)
                .map_err(|e| WasmError::InvalidParameter(format!("permit_deadline: {}", e)))?,
            permit_signature: biguint_from_hex_string(permit_signature)
                .map_err(|e| WasmError::InvalidParameter(format!("permit_signature: {}", e)))?
                .to_bytes_be(),
        })
    }
}
