use crate::wasm_error;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SignatureError {
    #[error("{}", wasm_error!("Failed to invoke sign_message - {0}"))]
    SignMessageInvocationFailed(String),

    #[error("{}", wasm_error!("Promise rejected while generating signature - {0}"))]
    PromiseRejected(String),

    #[error("{}", wasm_error!("Failed to convert signature to string"))]
    ConversionFailed,

    #[error("{}", wasm_error!("Failed to decode signature hex - {0}"))]
    SignatureHexDecodingFailed(String),

    #[error("{}", wasm_error!("Failed to create signing key - {0}"))]
    SigningKeyCreationFailed(String),

    #[error("{}", wasm_error!("Failed to sign commitment - {0}"))]
    SigningFailed(String),
}
