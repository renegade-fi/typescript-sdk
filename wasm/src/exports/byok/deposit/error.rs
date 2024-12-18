use crate::wasm_error;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DepositError {
    #[error("{}", wasm_error!("Invalid parameter: {0}"))]
    InvalidParameter(String),

    #[error("{}", wasm_error!("Wallet mutation failed: {0}"))]
    WalletMutation(String),
}
