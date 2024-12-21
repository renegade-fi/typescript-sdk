use wasm_bindgen::prelude::*;

const ERROR_PREFIX: &str = "[Rust/WASM]";

pub struct Error(JsError);

impl Error {
    pub fn new(msg: impl Into<String>) -> Self {
        Self(JsError::new(&format!("{ERROR_PREFIX} {}", msg.into())))
    }

    pub fn wallet_deserialization(e: impl std::fmt::Display) -> Self {
        Self::new(format!("Failed to deserialize wallet: {e}"))
    }

    pub fn invalid_parameter(e: impl std::fmt::Display) -> Self {
        Self::new(format!("Invalid parameter: {e}"))
    }

    pub fn wallet_mutation(e: impl std::fmt::Display) -> Self {
        Self::new(format!("Wallet mutation failed: {e}"))
    }

    pub fn sign_message(e: impl std::fmt::Display) -> Self {
        Self::new(format!("Failed to invoke sign_message: {e}"))
    }

    pub fn promise_rejected(e: impl std::fmt::Display) -> Self {
        Self::new(format!("Promise rejected while generating signature: {e}"))
    }
}

impl From<Error> for JsError {
    fn from(e: Error) -> Self {
        e.0
    }
}

impl<E: std::fmt::Display> From<E> for Error {
    fn from(e: E) -> Self {
        Self::new(e.to_string())
    }
}
