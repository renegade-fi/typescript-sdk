/// Errors that can occur during WASM operations
#[derive(Debug, thiserror::Error)]
pub enum WasmError {
    /// Error that occurs when failing to deserialize a wallet from JSON
    #[error("Failed to deserialize wallet: {0}")]
    WalletDeserialization(#[from] serde_json::Error),

    /// Error that occurs when failing to convert between wallet types
    #[error("Failed to convert wallet: {0}")]
    WalletConversion(String),
}
