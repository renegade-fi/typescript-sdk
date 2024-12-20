pub const WASM_ERROR_PREFIX: &str = "Rust/WASM Error:";

/// Helper macro to create error messages with the WASM prefix
#[macro_export]
macro_rules! wasm_err {
    ($msg:expr) => {
        format!("{} {}", WASM_ERROR_PREFIX, $msg)
    };
    ($fmt:expr, $($arg:tt)*) => {
        format!("{} {}", WASM_ERROR_PREFIX, format!($fmt, $($arg)*))
    };
}

/// Errors that can occur during WASM operations
#[derive(Debug, thiserror::Error)]
pub enum WasmError {
    /// Error that occurs when failing to deserialize a wallet from JSON
    #[error("{}", wasm_err!("Failed to deserialize wallet: {0}"))]
    WalletDeserialization(#[from] serde_json::Error),

    /// Error that occurs when failing to convert between wallet types
    #[error("{}", wasm_err!("Failed to convert wallet: {0}"))]
    WalletConversion(String),

    #[error("{}", wasm_err!("Invalid parameter: {0}"))]
    InvalidParameter(String),

    #[error("{}", wasm_err!("Wallet mutation failed: {0}"))]
    WalletMutation(String),

    // Signature errors
    #[error("{}", wasm_err!("Failed to invoke sign_message - {0}"))]
    SignMessageInvocationFailed(String),

    #[error("{}", wasm_err!("Promise rejected while generating signature - {0}"))]
    PromiseRejected(String),

    #[error("{}", wasm_err!("Failed to convert signature to string"))]
    ConversionFailed,

    #[error("{}", wasm_err!("Failed to decode signature hex - {0}"))]
    SignatureHexDecodingFailed(String),

    #[error("{}", wasm_err!("Failed to create signing key - {0}"))]
    SigningKeyCreationFailed(String),

    #[error("{}", wasm_err!("Failed to sign commitment - {0}"))]
    SigningFailed(String),

    #[error("{}", wasm_err!("{0}"))]
    Custom(String),
}
