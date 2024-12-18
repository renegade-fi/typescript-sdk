/// Errors generated when converting between relayer and smart contract types
#[derive(Clone, Debug)]
pub enum ConversionError {
    /// Error thrown when a variable-length input
    /// can't be coerced into a fixed-length array
    InvalidLength,
    /// Error thrown when converting between uint types
    InvalidUint,
}

pub const WASM_ERROR_PREFIX: &str = "Rust/WASM Error:";

/// Helper macro to create error messages with the WASM prefix
#[macro_export]
macro_rules! wasm_error {
    ($msg:expr) => {
        format!("{} {}", $crate::errors::WASM_ERROR_PREFIX, $msg)
    };
    ($fmt:expr, $($arg:tt)*) => {
        format!("{} {}", $crate::errors::WASM_ERROR_PREFIX, format!($fmt, $($arg)*))
    };
}
