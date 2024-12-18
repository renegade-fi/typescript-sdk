use super::error::WasmError;
use crate::{common::types::Wallet, external_api::types::ApiWallet};

/// Deserializes a JSON string into a [`Wallet`] type
///
/// # Arguments
///
/// * `json_str` - A JSON-formatted string representing a wallet
///
/// # Returns
///
/// * `Ok(Wallet)` - Successfully deserialized and converted wallet
/// * `Err(WasmError)` - Error during deserialization or conversion
pub fn deserialize_wallet(json_str: &str) -> Result<Wallet, WasmError> {
    let api_wallet: ApiWallet =
        serde_json::from_reader(json_str.as_bytes()).map_err(WasmError::WalletDeserialization)?;

    let internal_wallet: Result<Wallet, _> = api_wallet.try_into();
    internal_wallet.map_err(|e| WasmError::WalletConversion(e.to_string()))
}

/// Macro for serializing Rust types to JavaScript values
///
/// # Arguments
///
/// * `$expr` - The expression to serialize
///
/// # Returns
///
/// * `Ok(JsValue)` - Successfully serialized JavaScript value
/// * `Err(JsError)` - Error during serialization
#[macro_export]
macro_rules! serialize_to_js {
    ($expr:expr) => {
        serde_json::to_string(&$expr)
            .map(|result| JsValue::from_str(&result))
            .map_err(|e| JsError::new(&e.to_string()))
    };
}
