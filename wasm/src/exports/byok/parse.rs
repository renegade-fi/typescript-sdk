use crate::{
    circuit_types::keychain::{PublicKeyChain, PublicSigningKey, SecretIdentificationKey},
    common::keychain::{HmacKey, KeyChain, PrivateKeyChain},
    exports::error::WasmError,
    helpers::{biguint_from_hex_string, bytes_from_hex_string},
    types::Scalar,
};
use num_bigint::BigUint;
use uuid::Uuid;

pub struct DepositParameters {
    pub from_addr: BigUint,
    pub mint: BigUint,
    pub amount: BigUint,
    pub permit_nonce: BigUint,
    pub permit_deadline: BigUint,
    pub permit_signature: Vec<u8>,
}

impl DepositParameters {
    pub fn parse(
        from_addr: &str,
        mint: &str,
        amount: &str,
        permit_nonce: &str,
        permit_deadline: &str,
        permit_signature: &str,
    ) -> Result<Self, WasmError> {
        Ok(Self {
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

pub struct CreateWalletParameters {
    pub wallet_id: Uuid,
    pub blinder_seed: Scalar,
    pub share_seed: Scalar,
    // Keychain
    pub key_chain: KeyChain,
}

impl CreateWalletParameters {
    pub fn parse(
        wallet_id: &str,
        blinder_seed: &str,
        share_seed: &str,
        symmetric_key: &str,
        sk_match: &str,
        pk_root: &str,
    ) -> Result<Self, WasmError> {
        // Wallet seed info
        let wallet_id = Uuid::parse_str(wallet_id)
            .map_err(|e| WasmError::InvalidParameter(format!("wallet_id: {}", e)))?;
        let blinder_seed_bigint = biguint_from_hex_string(blinder_seed)
            .map_err(|e| WasmError::InvalidParameter(format!("blinder_seed: {}", e)))?;
        let blinder_seed = Scalar::from(blinder_seed_bigint);
        let share_seed_bigint = biguint_from_hex_string(share_seed)
            .map_err(|e| WasmError::InvalidParameter(format!("share_seed: {}", e)))?;
        let share_seed = Scalar::from(share_seed_bigint);

        // KeyChain
        let sk_match_bigint = biguint_from_hex_string(sk_match)
            .map_err(|e| WasmError::InvalidParameter(format!("sk_match: {}", e)))?;
        let sk_match_scalar = Scalar::from(sk_match_bigint);
        let sk_match = SecretIdentificationKey::from(sk_match_scalar);
        let pk_match = sk_match.get_public_key();
        let pk_root_bytes = bytes_from_hex_string(pk_root)
            .map_err(|e| WasmError::InvalidParameter(format!("pk_root: {}", e)))?;
        let pk_root = PublicSigningKey::from_bytes(&pk_root_bytes)
            .map_err(|e| WasmError::InvalidParameter(format!("pk_root: {}", e)))?;
        let symmetric_key = HmacKey::new(symmetric_key)
            .map_err(|e| WasmError::InvalidParameter(format!("symmetric_key: {}", e)))?;
        let key_chain = KeyChain {
            public_keys: PublicKeyChain::new(pk_root, pk_match),
            secret_keys: PrivateKeyChain {
                sk_root: None,
                sk_match,
                symmetric_key,
            },
        };
        Ok(Self {
            wallet_id,
            blinder_seed,
            share_seed,
            key_chain,
        })
    }
}
